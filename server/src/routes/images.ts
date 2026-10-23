import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { AppDeps } from '../app.ts';
import { makeSilhouette } from '../catalog/photo.ts';
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

  const stickerRoute = (prefix: 'pets' | 'fish', sql: string) =>
    app.get<{ Params: { id: string; size: string } }>(`/img/${prefix}/:id/:size`, async (request, reply) => {
      const { id, size } = request.params;
      if (!PET_SIZES.has(size)) return reply.status(404).send();
      const { rows } = await pool.query(sql, [id]);
      return serveSticker(reply, rows[0], size);
    });

  async function serveSticker(reply: FastifyReply, pet: { status: string; sticker_key: string | null } | undefined, size: string) {
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
  }

  stickerRoute('pets', 'SELECT status, sticker_key FROM pet_match.pets WHERE pet_id = $1');

  // 未收集卡片的剪影：由贴纸透明通道生成，浏览器拿不到真实毛色与花纹
  app.get<{ Params: { id: string; size: string } }>('/img/silhouettes/:id/:size', async (request, reply) => {
    const { id, size } = request.params;
    if (!PET_SIZES.has(size)) return reply.status(404).send();
    const pet = (await pool.query('SELECT status, sticker_key FROM pet_match.pets WHERE pet_id = $1', [id])).rows[0];
    if (!pet || pet.status !== 'published' || !pet.sticker_key) return reply.status(404).send();
    const cacheKey = `silhouette/${pet.sticker_key}/${size}`;
    const cached = await cache.get(cacheKey);
    if (cached) return send(reply, cached, 'public, max-age=31536000, immutable');
    if (!store) return reply.status(503).send();
    const obj = await store.get(`${pet.sticker_key}/${size}.png`);
    if (!obj) return reply.status(404).send();
    const body = await makeSilhouette(obj.body);
    await cache.put(cacheKey, body, 'image/png');
    return send(reply, { body, contentType: 'image/png' }, 'public, max-age=31536000, immutable');
  });

  // 卡背照片（处理后的版本）：只给已收集该宠物的玩家或主人本人
  app.get<{ Params: { id: string }; Querystring: { playerId?: string } }>('/img/photos/:id', async (request, reply) => {
    const playerId = request.query.playerId ?? '';
    const { rows } = await pool.query(
      `SELECT p.status, p.photo_key, p.owner_user_id,
              EXISTS (SELECT 1 FROM pet_match.collections c WHERE c.pet_id = p.pet_id AND c.player_id = $2) AS collected
       FROM pet_match.pets p WHERE p.pet_id = $1`,
      [request.params.id, playerId],
    );
    const pet = rows[0];
    if (!pet || pet.status !== 'published' || !pet.photo_key || !(pet.collected || pet.owner_user_id === playerId)) return reply.status(404).send();
    const cacheKey = `photo/${pet.photo_key}`;
    const cached = await cache.get(cacheKey);
    if (cached) return send(reply, cached, 'private, max-age=86400');
    if (!store) return reply.status(503).send();
    const obj = await store.get(pet.photo_key);
    if (!obj) return reply.status(404).send();
    await cache.put(cacheKey, obj.body, obj.contentType);
    return send(reply, obj, 'private, max-age=86400');
  });
  stickerRoute('fish', 'SELECT status, sticker_key FROM pet_match.fish_colors WHERE color_id = $1');
};
