import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { isListed } from '../services/players.ts';

const Query = z.object({ q: z.string().trim().max(60).default('') });
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

/** 同事搜索：名字包含关键词或邮箱前缀匹配；只返回展示所需字段。 */
export const rosterRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, directory }) => {
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
    const results = rows.map((r) => ({ userId: r.user_id, name: r.name }));
    // 名单里没有的在职同事：实时查 Slack 补上；Slack 不可用时只返回名单结果，不影响已有人员
    if (directory && results.length < 20) {
      try {
        const known = new Set(results.map((r) => r.userId));
        for (const m of await directory.search(q)) {
          if (results.length >= 20) break;
          if (!known.has(m.userId) && !(await isListed(pool, m.userId))) results.push({ userId: m.userId, name: m.name });
        }
      } catch (error) {
        request.log.warn(error, 'slack directory search failed');
      }
    }
    return { results };
  });
};
