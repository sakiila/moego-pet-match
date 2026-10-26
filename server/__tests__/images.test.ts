import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { buildApp } from '../src/app.ts';
import { sniffImage } from '../src/services/submissions.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import { freshDatabase } from './helpers.ts';
import { stickerImageUrl, STICKER_WEBP_VERSION } from '../../web/src/game/stickerImage.ts';

let PNG: Buffer;
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 2)]);

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
let app: ReturnType<typeof buildApp>;
const store = memoryStore();
let cacheDir: string;
let avatarCalls = 0;

beforeAll(async () => {
  PNG = await sharp({ create: { width: 128, height: 128, channels: 4, background: { r: 120, g: 80, b: 40, alpha: 0.5 } } }).png().toBuffer();
  ctx = await freshDatabase();
  cacheDir = mkdtempSync(join(tmpdir(), 'pm-img-'));
  app = buildApp({
    pool: ctx.pool,
    images: {
      cache: new DiskCache(cacheDir, 10 * 1024 * 1024),
      store,
      fetchAvatar: async (userId) => {
        avatarCalls++;
        return userId === 'U_TEST_BOB' ? { body: JPEG, contentType: 'image/jpeg' } : null;
      },
    },
  });
  await ctx.pool.query(`UPDATE pet_match.pets SET sticker_key = 'pets/mochi/abc123' WHERE pet_id = 'mochi'`);
  await store.put('pets/mochi/abc123/128.png', PNG, 'image/png');
});
afterAll(async () => {
  await app.close();
  await ctx.app.close();
  await ctx.pool.end();
});

const get = (url: string) => app.inject({ method: 'GET', url });

describe('头像代理', () => {
  it('首次从 Slack 取并缓存，之后直接从缓存返回', async () => {
    const a = await get('/img/avatars/U_TEST_BOB');
    expect(a.statusCode).toBe(200);
    expect(a.headers['content-type']).toBe('image/jpeg');
    expect((await get('/img/avatars/U_TEST_BOB')).statusCode).toBe(200);
    expect(avatarCalls).toBe(1);
  });

  it('没有头像或取不到时返回 404（前端用首字母头像）；名单外的 ID 不代理', async () => {
    expect((await get('/img/avatars/U_TEST_ALICE')).statusCode).toBe(404);
    const before = avatarCalls;
    expect((await get('/img/avatars/U_TEST_GUEST')).statusCode).toBe(404);
    expect(avatarCalls).toBe(before);
  });
});

describe('宠物图代理', () => {
  it('上架宠物从对象存储取、缓存，并带长期缓存头', async () => {
    const before = store.gets;
    const res = await get('/img/pets/mochi/128');
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
    expect(res.rawPayload.equals(PNG)).toBe(true);
    await get('/img/pets/mochi/128');
    expect(store.gets - before).toBe(1);
  });

  it('清空本地缓存后自动从对象存储重建', async () => {
    await new DiskCache(cacheDir, 0).clear();
    const before = store.gets;
    expect((await get('/img/pets/mochi/128')).statusCode).toBe(200);
    expect(store.gets - before).toBe(1);
  });

  it('无损 WebP 保留像素与透明度，并发生成只回源一次且可复用缓存', async () => {
    await new DiskCache(cacheDir, 0).clear();
    const before = store.gets;
    const responses = await Promise.all(Array.from({ length: 12 }, () => get('/img/pets/mochi/128?format=webp')));
    for (const res of responses) {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/webp');
      expect(res.headers['cache-control']).toContain('immutable');
      const raw = await sharp(res.rawPayload).ensureAlpha().raw().toBuffer();
      expect(raw.equals(await sharp(PNG).ensureAlpha().raw().toBuffer())).toBe(true);
      expect(res.rawPayload.length).toBeLessThan(PNG.length);
    }
    expect(store.gets - before).toBe(1);
    expect((await get('/img/pets/mochi/128?format=webp')).rawPayload.equals(responses[0].rawPayload)).toBe(true);
    expect(store.gets - before).toBe(1);
    expect((await get('/img/pets/mochi/128')).rawPayload.equals(PNG)).toBe(true);
    expect((await get('/img/pets/mochi/128?format=unknown')).statusCode).toBe(404);
  });

  it('版本化压缩图显著减小体积、保留透明通道，并隔离旧无损缓存', async () => {
    const pixels = Buffer.alloc(128 * 128 * 4);
    let seed = 123456789;
    const channel = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return seed & 255;
    };
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      pixels[i] = channel();
      pixels[i + 1] = channel();
      pixels[i + 2] = channel();
      pixels[i + 3] = Math.min(255, Math.min(x, y, 127 - x, 127 - y) * 24);
    }
    const input = await sharp(pixels, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer();
    const lossless = await sharp(input).webp({ lossless: true }).toBuffer();
    await ctx.pool.query(`INSERT INTO pet_match.pets (pet_id, name, status, sticker_key) VALUES ('compression-test', 'Test', 'published', 'pets/compression-test/v1')`);
    await store.put('pets/compression-test/v1/128.png', input, 'image/png');
    await new DiskCache(cacheDir, 10 * 1024 * 1024).put('pets/compression-test/v1/128/webp-lossless-v1', lossless, 'image/webp', 'pet:compression-test');
    const before = store.gets;
    const url = stickerImageUrl('pets', 'compression-test', 128);
    const responses = await Promise.all(Array.from({ length: 12 }, () => get(url)));
    const first = responses[0];
    expect(first.statusCode).toBe(200);
    expect(first.headers['cloudflare-cdn-cache-control']).toBe('public, max-age=7200');
    expect(first.rawPayload.length).toBeLessThan(lossless.length * 0.8);
    expect(await sharp(first.rawPayload).ensureAlpha().extractChannel(3).raw().toBuffer())
      .toEqual(await sharp(input).ensureAlpha().extractChannel(3).raw().toBuffer());
    expect(responses.every(res => res.rawPayload.equals(first.rawPayload))).toBe(true);
    expect(store.gets - before).toBe(1);
    expect((await get(url)).rawPayload).toEqual(first.rawPayload);
    expect(store.gets - before).toBe(1);
    expect((await get('/img/pets/compression-test/128?format=webp')).rawPayload).toEqual(lossless);
    expect((await get('/img/pets/compression-test/128')).rawPayload).toEqual(input);
    for (const query of ['format=webp&v=unknown', `format=png&v=${STICKER_WEBP_VERSION}`]) {
      const invalid = await get(`/img/pets/compression-test/128?${query}`);
      expect(invalid.statusCode).toBe(404);
      expect(invalid.headers['cache-control']).toBe('no-store');
      expect(invalid.headers['cloudflare-cdn-cache-control']).toBeUndefined();
    }
    await ctx.pool.query(`UPDATE pet_match.pets SET status = 'unpublished' WHERE pet_id = 'compression-test'`);
    const gone = await get(url);
    expect(gone.statusCode).toBe(404);
    expect(gone.headers['cache-control']).toBe('no-store');
    expect(gone.headers['cloudflare-cdn-cache-control']).toBeUndefined();
    expect(await new DiskCache(cacheDir, 1).hasGroup('pet:compression-test')).toBe(false);
  });

  it('简单色块的有损编码更大时沿用无损版本', async () => {
    const lossless = await get('/img/pets/mochi/128?format=webp');
    const compressed = await get(stickerImageUrl('pets', 'mochi', 128));
    expect(compressed.statusCode).toBe(200);
    expect(compressed.rawPayload.length).toBeLessThanOrEqual(lossless.rawPayload.length);
    expect(await sharp(compressed.rawPayload).ensureAlpha().extractChannel(3).raw().toBuffer())
      .toEqual(await sharp(PNG).ensureAlpha().extractChannel(3).raw().toBuffer());
  });

  it('下架后立即拒绝并清掉本地缓存；不支持的尺寸与无素材返回 404', async () => {
    await ctx.pool.query(`UPDATE pet_match.pets SET status = 'unpublished' WHERE pet_id = 'mochi'`);
    expect((await get('/img/pets/mochi/128')).statusCode).toBe(404);
    expect((await get('/img/pets/mochi/128?format=webp')).statusCode).toBe(404);
    const cached = await new DiskCache(cacheDir, 10 * 1024 * 1024).get('pet/pets/mochi/abc123/128');
    expect(cached).toBeNull();
    expect((await get('/img/pets/tofu/128')).statusCode).toBe(404);
    expect((await get('/img/pets/tofu/999')).statusCode).toBe(404);
  });

  it('超过容量上限时按最近使用淘汰', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pm-lru-'));
    const small = new DiskCache(dir, 150);
    await small.put('a', Buffer.alloc(100), 'image/png');
    await new Promise((r) => setTimeout(r, 20));
    await small.put('b', Buffer.alloc(100), 'image/png');
    expect(await small.get('a')).toBeNull();
    expect(await small.get('b')).not.toBeNull();
    expect(readdirSync(dir).filter((n) => !n.endsWith('.type'))).toHaveLength(1);
  });
});

describe('上传格式识别', () => {
  it('按文件头识别格式', () => {
    expect(sniffImage(PNG)?.ext).toBe('png');
    expect(sniffImage(JPEG)?.ext).toBe('jpg');
    expect(sniffImage(Buffer.from('RIFF0000WEBPVP8 '))?.ext).toBe('webp');
    expect(sniffImage(Buffer.from('0000ftypheic0000'))?.ext).toBe('heic');
    expect(sniffImage(Buffer.from('GIF89a...'))).toBeNull();
  });
});

describe('鱼色贴纸', () => {
  it('经 /img/fish 代理；未上传贴纸时 404', async () => {
    await ctx.pool.query(`UPDATE pet_match.fish_colors SET sticker_key = 'fish/fish_color_red/aaa' WHERE color_id = 'fish_color_red'`);
    await store.put('fish/fish_color_red/aaa/128.png', PNG, 'image/png');
    expect((await get('/img/fish/fish_color_red/128')).statusCode).toBe(200);
    const webp = await get('/img/fish/fish_color_red/128?format=webp');
    expect(webp.statusCode).toBe(200);
    expect(webp.headers['content-type']).toBe('image/webp');
    expect((await get('/img/fish/fish_color_blue/128')).statusCode).toBe(404);
  });
});
