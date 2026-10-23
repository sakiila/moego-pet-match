import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
let app: ReturnType<typeof buildApp>;
let dist: string;

beforeAll(async () => {
  ctx = await freshDatabase();
  dist = mkdtempSync(join(tmpdir(), 'pm-dist-'));
  mkdirSync(join(dist, 'assets'));
  writeFileSync(join(dist, 'index.html'), '<!doctype html><div id="root"></div>');
  writeFileSync(join(dist, 'assets', 'index-abc123.js'), 'console.log(1)');
  app = buildApp({ pool: ctx.pool, staticDir: dist });
});
afterAll(async () => {
  await app.close();
  await ctx.app.close();
  await ctx.pool.end();
});

const get = (url: string) => app.inject({ method: 'GET', url });

describe('生产：同一服务提供前端页面', () => {
  it('根路径返回 index.html，且不缓存（发布新版本后立即生效）', async () => {
    const res = await get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.body).toContain('id="root"');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('带内容哈希的资源长期缓存', async () => {
    const res = await get('/assets/index-abc123.js');
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('其他页面路径回退到 index.html（前端自己处理）', async () => {
    const res = await get('/some/page');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('id="root"');
  });

  it('不存在的接口与图片仍是 404，不返回页面', async () => {
    const api = await get('/api/nope');
    expect(api.statusCode).toBe(404);
    expect(api.headers['content-type']).toMatch(/json/);
    expect((await get('/img/nope/1')).statusCode).toBe(404);
    expect((await get('/assets/missing.js')).statusCode).toBe(404);
  });

  it('没配置前端目录时（开发）不提供页面', async () => {
    expect((await ctx.app.inject({ method: 'GET', url: '/' })).statusCode).toBe(404);
  });
});

describe('健康检查', () => {
  it('数据库可用时 200', async () => {
    const res = await get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('数据库不可用时 503', async () => {
    const dead = new pg.Pool({ connectionString: 'postgres://nobody:x@127.0.0.1:1/none', connectionTimeoutMillis: 300 });
    const down = buildApp({ pool: dead });
    const res = await down.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ ok: false });
    await down.close();
    await dead.end();
  });
});
