import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { LeaderboardView } from '../../../web/src/api/types.ts';
import type { AppDeps } from '../app.ts';

const Query = z.object({ mode: z.enum(['normal', 'fish']).default('normal'), playerId: z.string().optional() });

/**
 * 排行榜：只用个人最好成绩，普通／鱼分榜，RANK() 得到 1、2、2、4 的真实并列；
 * 只列仍在可参与名单内的同事，未保存的成绩不生成名次。
 */
export const leaderboardRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool }) => {
  app.get('/api/leaderboard', async (request, reply) => {
    const q = Query.safeParse(request.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    const { rows } = await pool.query(
      `SELECT RANK() OVER (ORDER BY b.score DESC)::int AS rank, b.player_id, c.name, b.score
       FROM pet_match.best_scores b
       JOIN pet_match.colleagues c ON c.user_id = b.player_id
       WHERE b.mode = $1
       ORDER BY b.score DESC, c.name ASC`,
      [q.data.mode],
    );
    const entries = rows.map((r) => ({ rank: r.rank, userId: r.player_id, name: r.name, score: r.score }));
    const view: LeaderboardView = {
      mode: q.data.mode,
      entries,
      me: entries.find((e) => e.userId === q.data.playerId) ?? null,
    };
    return view;
  });
};
