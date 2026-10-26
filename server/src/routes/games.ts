import { requirePlayer } from '../services/requirePlayer.ts';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { inTransaction } from '../db/pool.ts';
import { GameError, payloadHash, registerGame, ResultPayloadSchema, settleGame } from '../services/games.ts';
import { answerQuiz } from '../services/quiz.ts';
import { singleFlight } from '../services/singleFlight.ts';
import type { SettleResponse } from '../../../web/src/api/types.ts';

const RegisterBody = z.object({ playerId: z.string().min(1), mode: z.enum(['normal', 'fish']) });
const SettleBody = z.object({ playerId: z.string().min(1), result: ResultPayloadSchema });
const AnswerBody = z.object({ playerId: z.string().min(1), choice: z.string().min(1).nullable() });
const STATUS: Record<GameError['code'], number> = { not_found: 404, locked: 403, not_ready: 503, invalid: 422, conflict: 409 };

function sendGameError(reply: FastifyReply, error: unknown) {
  if (error instanceof GameError) return reply.status(STATUS[error.code]).send({ error: error.code, detail: error.detail });
  throw error;
}

export const gameRoutes: FastifyPluginAsync<AppDeps> = async (app, deps) => {
  const submitResult = singleFlight<SettleResponse>();
  app.post('/api/games', async (request, reply) => {
    const body = RegisterBody.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!await requirePlayer(request, reply, deps.pool, body.data.playerId)) return;
    try {
      return await registerGame(deps.pool, body.data.playerId, body.data.mode);
    } catch (error) {
      return sendGameError(reply, error);
    }
  });

  app.post<{ Params: { id: string } }>('/api/quizzes/:id/answer', async (request, reply) => {
    if (!z.string().uuid().safeParse(request.params.id).success) return reply.status(404).send({ error: 'not_found' });
    const body = AnswerBody.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!await requirePlayer(request, reply, deps.pool, body.data.playerId)) return;
    const result = await inTransaction(deps.pool, (client) => answerQuiz(client, request.params.id, body.data.playerId, body.data.choice));
    if (!result) return reply.status(404).send({ error: 'not_found' });
    return result;
  });

  app.post<{ Params: { id: string } }>('/api/games/:id/result', async (request, reply) => {
    if (!z.string().uuid().safeParse(request.params.id).success) return reply.status(404).send({ error: 'not_found' });
    const body = SettleBody.safeParse(request.body);
    if (!body.success) return reply.status(422).send({ error: 'invalid', detail: 'schema' });
    if (!await requirePlayer(request, reply, deps.pool, body.data.playerId)) return;
    try {
      const { playerId, result } = body.data;
      const id = request.params.id;
      // 包含玩家和结果哈希，冲突内容仍进入数据库原有校验；跨进程的最终幂等仍由事务保证。
      return await submitResult(JSON.stringify([id, playerId, payloadHash(result)]), () =>
        settleGame(deps.pool, id, playerId, result, deps.settleHooks));
    } catch (error) {
      return sendGameError(reply, error);
    }
  });
};
