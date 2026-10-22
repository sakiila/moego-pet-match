import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { GameError, registerGame, ResultPayloadSchema, settleGame } from '../services/games.ts';

const RegisterBody = z.object({ playerId: z.string().min(1), mode: z.enum(['normal', 'fish']) });
const SettleBody = z.object({ playerId: z.string().min(1), result: ResultPayloadSchema });
const STATUS: Record<GameError['code'], number> = { not_found: 404, locked: 403, not_ready: 503, invalid: 422, conflict: 409 };

function sendGameError(reply: FastifyReply, error: unknown) {
  if (error instanceof GameError) return reply.status(STATUS[error.code]).send({ error: error.code, detail: error.detail });
  throw error;
}

export const gameRoutes: FastifyPluginAsync<AppDeps> = async (app, deps) => {
  app.post('/api/games', async (request, reply) => {
    const body = RegisterBody.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    try {
      return await registerGame(deps.pool, body.data.playerId, body.data.mode);
    } catch (error) {
      return sendGameError(reply, error);
    }
  });

  app.post<{ Params: { id: string } }>('/api/games/:id/result', async (request, reply) => {
    if (!z.string().uuid().safeParse(request.params.id).success) return reply.status(404).send({ error: 'not_found' });
    const body = SettleBody.safeParse(request.body);
    if (!body.success) return reply.status(422).send({ error: 'invalid', detail: 'schema' });
    try {
      return await settleGame(deps.pool, request.params.id, body.data.playerId, body.data.result, deps.settleHooks);
    } catch (error) {
      return sendGameError(reply, error);
    }
  });
};
