import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { buildAuthenticatedApp as buildApp } from './helpers.ts';
import { sniffImage } from '../src/services/submissions.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import { freshDatabase } from './helpers.ts';

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
