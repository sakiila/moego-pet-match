import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { AppDeps } from '../app.ts';
import { findColleague } from '../services/players.ts';

const PET_SIZES = new Set(['128', '512', '1024']);
const AVATAR_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function send(reply: FastifyReply, img: { body: Buffer; contentType: string }, cacheControl: string) {
  return reply.header('content-type', img.contentType).header('cache-control', cacheControl).send(img.body);
}

/**
 * 图片统一经自有域名返回，浏览器不直连 Slack 或 R2。
 * 宠物图返回前检查上架状态，下架即拒绝并清掉本地缓存；对象键带内容哈希，可长期缓存。
 */
export const imageRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, images }) => {
  if (!images) return;
  const { cache, store, fetchAvatar } = images;

  app.get<{ Params: { userId: string } }>('/img/avatars/:userId', async (request, reply) => {
    const { userId } = request.params;
    if (!(await findColleague(pool, userId))) return reply.status(404).send();
    const key = `avatar/${userId}`;
    const cached = await cache.get(key, AVATAR_MAX_AGE_MS);
    if (cached) return send(reply, cached, 'public, max-age=3600');
    const fetched = await fetchAvatar(userId).catch(() => null);
    if (!fetched) return reply.status(404).send();
    await cache.put(key, fetched.body, fetched.contentType);
    return send(reply, fetched, 'public, max-age=3600');
  });

  app.get<{ Params: { petId: string; size: string } }>('/img/pets/:petId/:size', async (request, reply) => {
    const { petId, size } = request.params;
    if (!PET_SIZES.has(size)) return reply.status(404).send();
    const { rows } = await pool.query('SELECT status, sticker_key FROM pet_match.pets WHERE pet_id = $1', [petId]);
    const pet = rows[0];
    if (!pet || pet.status !== 'published' || !pet.sticker_key) {
      if (pet?.sticker_key) await cache.delete(`pet/${pet.sticker_key}/${size}`);
      return reply.status(404).send();
    }
    const objectKey = `${pet.sticker_key}/${size}.png`;
    const cacheKey = `pet/${pet.sticker_key}/${size}`;
    const cached = await cache.get(cacheKey);
    if (cached) return send(reply, cached, 'public, max-age=31536000, immutable');
    if (!store) return reply.status(503).send();
    const obj = await store.get(objectKey);
    if (!obj) return reply.status(404).send();
    await cache.put(cacheKey, obj.body, obj.contentType);
    return send(reply, obj, 'public, max-age=31536000, immutable');
  });
};
