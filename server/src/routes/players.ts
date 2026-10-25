import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app.ts';
import { loadPlayer, registerFromSlack } from '../services/players.ts';
import { findColleague } from '../services/players.ts';
import { z } from 'zod';
import { inTransaction } from '../db/pool.ts';
import { readAchievements } from '../services/achievements.ts';
import { ACHIEVEMENT_IDS } from '../../../web/src/game/achievementRules.ts';
import { loadPlayerProfile } from '../services/playerProfile.ts';
import { addPlayerLike, loadPlayerLikes } from '../services/playerLikes.ts';

/** 回访校验所选身份：仍在可参与名单则返回资料与个人记录，否则 404；名单外的在职 Slack 同事首次选中时登记。 */
export const playerRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, directory }) => {
  app.get<{ Params: { id: string } }>('/api/players/:id/likes', async (request, reply) => {
    const query = z.object({ viewerId: z.string().min(1) }).safeParse(request.query);
    if (!query.success) return reply.status(400).send({ error: 'invalid_request' });
    const view = await loadPlayerLikes(pool, request.params.id, query.data.viewerId);
    return view ?? reply.status(404).send({ error: 'not_found' });
  });

  app.post<{ Params: { id: string } }>('/api/players/:id/likes', async (request, reply) => {
    const body = z.object({ playerId: z.string().min(1) }).strict().safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    const targetId = request.params.id;
    const sourceId = body.data.playerId;
    if (targetId === sourceId) {
      const self = await loadPlayerLikes(pool, targetId, sourceId);
      return self ? reply.status(400).send({ error: 'invalid_request' }) : reply.status(404).send({ error: 'not_found' });
    }
    const view = await addPlayerLike(pool, targetId, sourceId);
    return view ?? reply.status(404).send({ error: 'not_found' });
  });

  app.get<{ Params: { id: string } }>('/api/players/:id/profile', async (request, reply) => {
    const query = z.object({mode:z.enum(['normal','fish']).default('normal')}).safeParse(request.query);
    if (!query.success) return reply.status(400).send({error:'invalid_request'});
    const profile = await loadPlayerProfile(pool, request.params.id, query.data.mode);
    return profile ?? reply.status(404).send({error:'not_found'});
  });
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
    const titles = await inTransaction(pool, client => readAchievements(client, player!.userId));
    if (titles.equippedTitle) player.equippedTitle = titles.equippedTitle;
    else delete player.equippedTitle;
    return player;
  });

  app.get<{ Params: { id: string } }>('/api/players/:id/achievements', async (request, reply) => {
    const playerId = request.params.id;
    if (!await findColleague(pool, playerId)) return reply.status(404).send({ error: 'not_found' });
    return inTransaction(pool, client => readAchievements(client, playerId));
  });

  app.patch<{ Params: { id: string } }>('/api/players/:id/title', async (request, reply) => {
    const body = z.object({ title: z.enum(ACHIEVEMENT_IDS).nullable() }).strict().safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    const playerId = request.params.id;
    if (!await findColleague(pool, playerId)) return reply.status(404).send({ error: 'not_found' });
    const result = await inTransaction(pool, async client => {
      const view = await readAchievements(client, playerId);
      if (body.data.title && !view.achievements.some(a => a.id === body.data.title && a.unlockedAt)) return null;
      await client.query(`INSERT INTO pet_match.player_titles(player_id,equipped_title) VALUES($1,$2)
        ON CONFLICT(player_id) DO UPDATE SET equipped_title=EXCLUDED.equipped_title`, [playerId, body.data.title]);
      return { ...view, equippedTitle: body.data.title };
    });
    if (!result) return reply.status(409).send({ error: 'locked' });
    return result;
  });
};
