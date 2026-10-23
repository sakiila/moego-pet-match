import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { dailyManager, listCollection, petDetail } from '../services/pets.ts';
import { findColleague } from '../services/players.ts';

const PlayerQuery = z.object({ playerId: z.string().min(1) });

export const petRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool }) => {
  app.get('/api/pets', async (request, reply) => {
    const q = PlayerQuery.safeParse(request.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!(await findColleague(pool, q.data.playerId))) return reply.status(404).send({ error: 'not_found' });
    return listCollection(pool, q.data.playerId);
  });

  app.get<{ Params: { id: string } }>('/api/pets/:id', async (request, reply) => {
    const q = PlayerQuery.safeParse(request.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    const detail = await petDetail(pool, request.params.id, q.data.playerId);
    if (!detail) return reply.status(404).send({ error: 'not_found' });
    return detail;
  });

  app.get('/api/manager', async (_request, reply) => {
    const manager = await dailyManager(pool);
    if (!manager) return reply.status(404).send({ error: 'not_found' });
    return manager;
  });
};
