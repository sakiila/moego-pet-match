import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { requirePlayer } from '../services/requirePlayer.ts';
import type { AppDeps } from '../app.ts';
import { makeSilhouette } from '../catalog/photo.ts';
import { findColleague } from '../services/players.ts';
import { singleFlight } from '../services/singleFlight.ts';
import type { StoredObject } from '../storage/objectStore.ts';
import sharp from 'sharp';
import { STICKER_SIZES, STICKER_WEBP_VERSION } from '../../../web/src/game/stickerImage.ts';

const PET_SIZES = new Set<string>(STICKER_SIZES.map(String));
const AVATAR_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function send(reply: FastifyReply, img: { body: Buffer; contentType: string }, cacheControl: string) {
  return reply.header('content-type', img.contentType).header('cache-control', cacheControl).send(img.body);
}

/**
 * 图片统一经自有域名返回，浏览器不直连 Slack 或 R2。
 * 宠物图返回前检查上架状态，下架即拒绝并清掉该宠物的整组本地缓存；对象键带内容哈希，可长期缓存。
 */
export const imageRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, images }) => {
  if (!images) return;
  const { cache, store, fetchAvatar } = images;
  const pendingImage = singleFlight<StoredObject | null>();
  const loadImage = (key: string, group: string | undefined, load: () => Promise<StoredObject | null>, maxAgeMs?: number) =>
    pendingImage(JSON.stringify([group, key]), async () => {
      const cached = await cache.get(key, maxAgeMs, group);
      if (cached) return cached;
      const image = await load();
      if (image) await cache.put(key, image.body, image.contentType, group);
      return image;
    });

  app.get<{ Params: { userId: string } }>('/img/avatars/:userId', async (request, reply) => {
    const { userId } = request.params;
    if (!(await findColleague(pool, userId))) return reply.status(404).send();
    const key = `avatar/${userId}`;
    const fetched = await loadImage(key, undefined, () => fetchAvatar(userId).catch(() => null), AVATAR_MAX_AGE_MS);
    if (!fetched) return reply.status(404).send();
    return send(reply, fetched, 'public, max-age=3600');
  });

  /** 宠物的全部缓存（贴纸、剪影、卡背照片）放在同一组，下架时一次清掉。 */
  const groupOf = (prefix: 'pets' | 'fish', id: string) => `${prefix === 'pets' ? 'pet' : 'fish'}:${id}`;
  const gone = async (reply: FastifyReply, group: string) => {
    await cache.deleteGroup(group);
    return reply.status(404).send();
  };

  const stickerRoute = (prefix: 'pets' | 'fish', sql: string) =>
    app.get<{ Params: { id: string; size: string }; Querystring: { format?: string; v?: string } }>(`/img/${prefix}/:id/:size`, async (request, reply) => {
      // 错误、下架与未知版本不可被 CDN 缓存；成功时再覆盖浏览器缓存头。
      reply.header('cache-control', 'no-store');
      const { id, size } = request.params;
      const { format, v } = request.query;
      if (!PET_SIZES.has(size) || (format !== undefined && format !== 'png' && format !== 'webp')) return reply.status(404).send();
      if (v !== undefined && (format !== 'webp' || v !== STICKER_WEBP_VERSION)) return reply.status(404).send();
      const { rows } = await pool.query(sql, [id]);
      const pet = rows[0] as { status: string; sticker_key: string | null } | undefined;
      const group = groupOf(prefix, id);
      if (!pet || pet.status !== 'published' || !pet.sticker_key) return gone(reply, group);
      const cacheKey = `${pet.sticker_key}/${size}`;
      const source = () => loadImage(cacheKey, group, () => store ? store.get(`${pet.sticker_key}/${size}.png`) : Promise.resolve(null));
      const obj = format === 'webp'
        ? await loadImage(`${cacheKey}/${v === STICKER_WEBP_VERSION ? `webp-${STICKER_WEBP_VERSION}` : 'webp-lossless-v1'}`, group, async () => {
          const png = await source();
          if (!png) return null;
          const options = v === STICKER_WEBP_VERSION ? { quality: 85, alphaQuality: 100, effort: 4 } : { lossless: true };
          const body = await sharp(png.body).webp(options).toBuffer();
          if (v === STICKER_WEBP_VERSION) {
            // 简单色块有时无损编码更小，保留更小的结果，避免压缩反而增大体积。
            const lossless = await loadImage(`${cacheKey}/webp-lossless-v1`, group, async () => ({
              body: await sharp(png.body).webp({ lossless: true }).toBuffer(), contentType: 'image/webp',
            }));
            if (lossless && lossless.body.length <= body.length) return lossless;
          }
          return { body, contentType: 'image/webp' };
        })
        : await source();
      if (!obj) return reply.status(store ? 404 : 503).send();
      if (v === STICKER_WEBP_VERSION) reply.header('cloudflare-cdn-cache-control', 'public, max-age=7200');
      return send(reply, obj, 'public, max-age=31536000, immutable');
    });

  stickerRoute('pets', 'SELECT status, sticker_key FROM pet_match.pets WHERE pet_id = $1');

  // 未收集卡片的剪影：由贴纸透明通道生成，浏览器拿不到真实毛色与花纹
  app.get<{ Params: { id: string; size: string } }>('/img/silhouettes/:id/:size', async (request, reply) => {
    const { id, size } = request.params;
    if (!PET_SIZES.has(size)) return reply.status(404).send();
    const pet = (await pool.query('SELECT status, sticker_key FROM pet_match.pets WHERE pet_id = $1', [id])).rows[0];
    const group = groupOf('pets', id);
    if (!pet || pet.status !== 'published' || !pet.sticker_key) return gone(reply, group);
    const cacheKey = `silhouette/${pet.sticker_key}/${size}`;
    const image = await loadImage(cacheKey, group, async () => {
      const obj = await store?.get(`${pet.sticker_key}/${size}.png`);
      return obj ? { body: await makeSilhouette(obj.body), contentType: 'image/png' } : null;
    });
    if (!image) return reply.status(store ? 404 : 503).send();
    return send(reply, image, 'public, max-age=31536000, immutable');
  });

  // 卡背照片（处理后的版本）：只给已收集该宠物的玩家或主人本人
  app.get<{ Params: { id: string }; Querystring: { playerId?: string } }>('/img/photos/:id', async (request, reply) => {
    const playerId = request.query.playerId ?? '';
    if (!await requirePlayer(request, reply, pool, playerId)) return;
    const { rows } = await pool.query(
      `SELECT p.status, p.photo_key, p.owner_user_id,
              EXISTS (SELECT 1 FROM pet_match.collections c WHERE c.pet_id = p.pet_id AND c.player_id = $2) AS collected
       FROM pet_match.pets p WHERE p.pet_id = $1`,
      [request.params.id, playerId],
    );
    const pet = rows[0];
    const group = groupOf('pets', request.params.id);
    if (!pet || pet.status !== 'published') return gone(reply, group);
    if (!pet.photo_key || !(pet.collected || pet.owner_user_id === playerId)) return reply.status(404).send();
    const cacheKey = `photo/${pet.photo_key}`;
    const obj = await loadImage(cacheKey, group, () => store ? store.get(pet.photo_key) : Promise.resolve(null));
    if (!obj) return reply.status(store ? 404 : 503).send();
    return send(reply, obj, 'private, no-store');
  });

  // 启动时清一次已下架宠物的缓存（下架发生在命令行，服务端此前可能没收到对应请求）
  app.addHook('onReady', async () => {
    try {
      const { rows } = await pool.query(`SELECT pet_id FROM pet_match.pets WHERE status <> 'published'`);
      for (const r of rows) await cache.deleteGroup(groupOf('pets', r.pet_id));
    } catch (error) {
      app.log.warn({ error }, 'cache sweep for removed pets failed');
    }
  });

  stickerRoute('fish', 'SELECT status, sticker_key FROM pet_match.fish_colors WHERE color_id = $1');
};
