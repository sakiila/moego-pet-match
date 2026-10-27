import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { LeaderboardView } from '../../../web/src/api/types.ts';
import type { AppDeps } from '../app.ts';
import { beijingDate } from '../services/pets.ts';

const Query = z.object({
  mode: z.enum(['normal', 'fish', 'ai']).default('normal'),
  scope: z.enum(['today', 'all']).default('all'),
  playerId: z.string().optional(),
});

/** 总榜：个人最好成绩。 */
const ALL_TIME_SQL = `
  SELECT RANK() OVER (ORDER BY b.score DESC)::int AS rank, b.player_id, c.name, b.score, t.equipped_title
  FROM pet_match.best_scores b
  JOIN pet_match.colleagues c ON c.user_id = b.player_id
  LEFT JOIN pet_match.player_titles t ON t.player_id = b.player_id
  WHERE b.mode = $1
  ORDER BY b.score DESC, c.name ASC`;

/** 今日榜：登记在当天（北京自然日）的对局里，每人已结算的最高分（含猜主人加分）。 */
const TODAY_SQL = `
  WITH best AS (
    SELECT g.player_id, max(r.score)::int AS score
    FROM pet_match.games g
    JOIN pet_match.game_results r ON r.game_id = g.game_id
    WHERE g.mode = $1 AND g.board_date = $2
    GROUP BY g.player_id
  )
  SELECT RANK() OVER (ORDER BY b.score DESC)::int AS rank, b.player_id, c.name, b.score, t.equipped_title
  FROM best b
  JOIN pet_match.colleagues c ON c.user_id = b.player_id
  LEFT JOIN pet_match.player_titles t ON t.player_id = b.player_id
  ORDER BY b.score DESC, c.name ASC`;

/**
 * 排行榜：普通／鱼分榜，总榜用个人最好、今日榜用当天最好；RANK() 得到 1、2、2、4 的真实并列；
 * 只列仍在可参与名单内的同事，未保存的成绩不生成名次。
 */
export const leaderboardRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool }) => {
  app.get('/api/leaderboard', async (request, reply) => {
    const q = Query.safeParse(request.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    const date = beijingDate();
    const { rows } = q.data.scope === 'today' ? await pool.query(TODAY_SQL, [q.data.mode, date]) : await pool.query(ALL_TIME_SQL, [q.data.mode]);
    const entries = rows.map((r) => ({ rank: r.rank, userId: r.player_id, name: r.name, score: r.score, ...(r.equipped_title ? { equippedTitle: r.equipped_title } : {}) }));
    const view: LeaderboardView = {
      mode: q.data.mode,
      scope: q.data.scope,
      date,
      entries,
      me: entries.find((e) => e.userId === q.data.playerId) ?? null,
    };
    return view;
  });
};
