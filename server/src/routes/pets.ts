import { requirePlayer } from '../services/requirePlayer.ts';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { beijingDate, dailyManager, listCollection, petDetail } from '../services/pets.ts';
import { findColleague } from '../services/players.ts';
import { singleFlight } from '../services/singleFlight.ts';
import type { DailyManager } from '../../../web/src/api/types.ts';

const PlayerQuery = z.object({ playerId: z.string().min(1) });

export const petRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, now = () => new Date() }) => {
  const loadManager = singleFlight<DailyManager | null>();
  app.get('/api/pets', async (request, reply) => {
    const q = PlayerQuery.safeParse(request.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!await requirePlayer(request, reply, pool, q.data.playerId)) return;
    if (!(await findColleague(pool, q.data.playerId))) return reply.status(404).send({ error: 'not_found' });
    return listCollection(pool, q.data.playerId);
  });

  app.get<{ Params: { id: string } }>('/api/pets/:id', async (request, reply) => {
    const q = PlayerQuery.safeParse(request.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!await requirePlayer(request, reply, pool, q.data.playerId)) return;
    const detail = await petDetail(pool, request.params.id, q.data.playerId);
    if (!detail) return reply.status(404).send({ error: 'not_found' });
    return detail;
  });

  app.get('/api/manager', async (_request, reply) => {
    const time = now();
    const manager = await loadManager(beijingDate(time), () => dailyManager(pool, time));
    if (!manager) return reply.status(404).send({ error: 'not_found' });
    return manager;
  });
};
