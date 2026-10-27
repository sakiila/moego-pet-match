import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { FactionError, joinFaction, loadFaction } from '../services/faction.ts';
import { requirePlayer } from '../services/requirePlayer.ts';

/** 猫派 vs 狗派周：读拉锯与个人状态、报名。只对已登录的本人开放。 */
export const factionRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool }) => {
  app.get('/api/faction', async (request, reply) => {
    const query = z.object({ playerId: z.string().min(1) }).safeParse(request.query);
    if (!query.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!await requirePlayer(request, reply, pool, query.data.playerId)) return;
    return loadFaction(pool, query.data.playerId);
  });

  app.post('/api/faction/join', async (request, reply) => {
    const body = z.object({ playerId: z.string().min(1), faction: z.enum(['cat', 'dog']) }).strict().safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!await requirePlayer(request, reply, pool, body.data.playerId)) return;
    try {
      await joinFaction(pool, body.data.playerId, body.data.faction);
    } catch (error) {
      if (error instanceof FactionError) return reply.status(409).send({ error: error.code });
      throw error;
    }
    return loadFaction(pool, body.data.playerId);
  });
};
