import { requirePlayer } from '../services/requirePlayer.ts';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { inTransaction } from '../db/pool.ts';
import { GameError, payloadHash, registerGame, ResultPayloadSchema, settleGame } from '../services/games.ts';
import { answerQuiz } from '../services/quiz.ts';
import { singleFlight } from '../services/singleFlight.ts';
import type { SettleResponse } from '../../../web/src/api/types.ts';
import { checkGameRate, startVerifiedGame } from '../services/gameSecurity.ts';
import { findColleague } from '../services/players.ts';
import { isIP } from 'node:net';
import { requestBudget } from '../services/requestBudget.ts';
import { LiveMoveBody, playLiveMove } from '../services/livePlay.ts';

const playerIdSchema = z.string().min(1).max(80);
const RegisterBody = z.object({ playerId: playerIdSchema, mode: z.enum(['normal', 'fish', 'ai']) });
const SettleBody = z.object({ playerId: playerIdSchema, result: ResultPayloadSchema });
const StartBody = z.object({ playerId: playerIdSchema, turnstileToken: z.string().max(2048) });
const AnswerBody = z.object({ playerId: z.string().min(1), choice: z.string().min(1).nullable() });
const STATUS: Record<GameError['code'], number> = { not_found: 404, locked: 403, not_ready: 503, invalid: 422, conflict: 409, verification_failed: 403 };

function sendGameError(reply: FastifyReply, error: unknown) {
  if (error instanceof GameError) return reply.status(STATUS[error.code]).send({ error: error.code, detail: error.detail });
  throw error;
}

export const gameRoutes: FastifyPluginAsync<AppDeps> = async (app, deps) => {
  const submitResult = singleFlight<SettleResponse>();
  const now = () => deps.now?.() ?? new Date();
  const burst = requestBudget();
  app.addHook('onRequest', async (request, reply) => {
    if (!deps.gameSecurity || request.method !== 'POST' || !/^\/api\/games(?:\?|$|\/[^/?]+\/(?:start|result)(?:\?|$))/.test(request.url)) return;
    // 边缘传入的地址只用于额外突发保护；真正的玩家限流仍以数据库原子计数为准。
    const forwarded = request.headers['cf-connecting-ip'];
    const key = typeof forwarded === 'string' && isIP(forwarded) ? forwarded : request.ip;
    const retry = burst(key, now().getTime());
    if (retry) return reply.header('retry-after', retry).status(429).send({ error: 'rate_limited' });
  });
  const bearer = (value: string | undefined) => value?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  const rate = async (playerId: string, operation: 'prepare' | 'start' | 'result', reply: FastifyReply) => {
    if (!deps.gameSecurity) return true;
    // 名单外标识不建立持久计数，避免攻击者用随机 playerId 撑大限流表。
    if (!await findColleague(deps.pool, playerId)) { reply.status(404).send({ error: 'not_found' }); return false; }
    const retry = await checkGameRate(deps.pool, `${operation}:${playerId}`, { prepare: 8, start: 6, result: 20 }[operation], now());
    if (retry) { reply.header('retry-after', retry).status(429).send({ error: 'rate_limited' }); return false; }
    return true;
  };
  app.get('/api/game-security', async (_request, reply) => reply.header('cache-control', 'no-store').send(
    deps.gameSecurity ? { enabled: true, siteKey: deps.gameSecurity.siteKey } : { enabled: false },
  ));
  app.post('/api/games', async (request, reply) => {
    const body = RegisterBody.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!await requirePlayer(request, reply, deps.pool, body.data.playerId)) return;
    if (!await rate(body.data.playerId, 'prepare', reply)) return;
    try {
      return await registerGame(deps.pool, body.data.playerId, body.data.mode, now(), undefined, !!deps.gameSecurity);
    } catch (error) {
      return sendGameError(reply, error);
    }
  });

  app.post<{ Params: { id: string } }>('/api/games/:id/start', { bodyLimit: 4096 }, async (request, reply) => {
    const body = StartBody.safeParse(request.body);
    const playToken = bearer(request.headers.authorization);
    if (!z.string().uuid().safeParse(request.params.id).success) return reply.status(404).send({ error: 'not_found' });
    if (!body.success || !playToken) return reply.status(400).send({ error: 'invalid_request' });
    if (!deps.gameSecurity) return reply.status(404).send({ error: 'not_found' });
    if (!await requirePlayer(request, reply, deps.pool, body.data.playerId)) return;
    if (!await rate(body.data.playerId, 'start', reply)) return;
    try {
      return await startVerifiedGame(deps.pool, request.params.id, body.data.playerId, body.data.turnstileToken, playToken, deps.gameSecurity, now());
    } catch (error) { return sendGameError(reply, error); }
  });

  // 服务端执棋：正式局每次交换都在这里结算，补落从不提前下发。
  app.post<{ Params: { id: string } }>('/api/games/:id/moves', { bodyLimit: 4096 }, async (request, reply) => {
    if (!z.string().uuid().safeParse(request.params.id).success) return reply.status(404).send({ error: 'not_found' });
    const body = LiveMoveBody.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!await requirePlayer(request, reply, deps.pool, body.data.playerId)) return;
    try {
      const { playerId, index, move } = body.data;
      return await playLiveMove(deps.pool, request.params.id, playerId, bearer(request.headers.authorization), index, move, now());
    } catch (error) { return sendGameError(reply, error); }
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

  app.post<{ Params: { id: string } }>('/api/games/:id/result', { bodyLimit: 100_000 }, async (request, reply) => {
    if (!z.string().uuid().safeParse(request.params.id).success) return reply.status(404).send({ error: 'not_found' });
    const body = SettleBody.safeParse(request.body);
    if (!body.success) return reply.status(422).send({ error: 'invalid', detail: 'schema' });
    if (!await requirePlayer(request, reply, deps.pool, body.data.playerId)) return;
    if (!await rate(body.data.playerId, 'result', reply)) return;
    try {
      const { playerId, result } = body.data;
      const id = request.params.id;
      // 包含玩家和结果哈希，冲突内容仍进入数据库原有校验；跨进程的最终幂等仍由事务保证。
      const token = bearer(request.headers.authorization);
      return await submitResult(JSON.stringify([id, playerId, payloadHash(result), token]), () =>
        settleGame(deps.pool, id, playerId, result, deps.settleHooks, { token, now: now(), required: !!deps.gameSecurity }));
    } catch (error) {
      return sendGameError(reply, error);
    }
  });
};
