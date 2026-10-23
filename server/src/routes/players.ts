import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app.ts';
import { loadPlayer, registerFromSlack } from '../services/players.ts';

/** 回访校验所选身份：仍在可参与名单则返回资料与个人记录，否则 404；名单外的在职 Slack 同事首次选中时登记。 */
export const playerRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, directory }) => {
  app.get<{ Params: { id: string } }>('/api/players/:id', async (request, reply) => {
    let player = await loadPlayer(pool, request.params.id);
    if (!player && directory) {
      // 选中名单外的 Slack 同事：确认在职后登记，再按正常流程返回
      try {
        if (await registerFromSlack(pool, directory, request.params.id)) player = await loadPlayer(pool, request.params.id);
      } catch (error) {
        request.log.warn(error, 'slack directory lookup failed');
        return reply.status(503).send({ error: 'unavailable' });
      }
    }
    if (!player) return reply.status(404).send({ error: 'not_found' });
    return player;
  });
};
