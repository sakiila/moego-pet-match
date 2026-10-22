import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app.ts';
import { loadPlayer } from '../services/players.ts';

/** 回访校验所选身份：仍在可参与名单则返回资料与个人记录，否则 404。 */
export const playerRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool }) => {
  app.get<{ Params: { id: string } }>('/api/players/:id', async (request, reply) => {
    const player = await loadPlayer(pool, request.params.id);
    if (!player) return reply.status(404).send({ error: 'not_found' });
    return player;
  });
};
