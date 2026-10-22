import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';

const Query = z.object({ q: z.string().trim().max(60).default('') });
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

/** 同事搜索：名字包含关键词或邮箱前缀匹配；只返回展示所需字段。 */
export const rosterRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool }) => {
  app.get('/api/roster', async (request, reply) => {
    const parsed = Query.safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_request' });
    const q = parsed.data.q;
    if (!q) return { results: [] };
    const like = escapeLike(q);
    const { rows } = await pool.query(
      `SELECT user_id, name FROM pet_match.colleagues
       WHERE name ILIKE '%' || $1 || '%' OR split_part(email, '@', 1) ILIKE $1 || '%'
       ORDER BY name
       LIMIT 20`,
      [like],
    );
    return { results: rows.map((r) => ({ userId: r.user_id, name: r.name })) };
  });
};
