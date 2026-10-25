import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { RULES_VERSION } from '../../web/src/engine/config.ts';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => {
  ctx = await freshDatabase();
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});

describe('/api/version', () => {
  it('返回构建版本与引擎规则版本，且不缓存', async () => {
    const app = buildApp({ pool: ctx.pool, gameVersion: '20261025.15' });
    const res = await app.inject({ method: 'GET', url: '/api/version' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ version: '20261025.15', rulesVersion: RULES_VERSION });
    expect(res.headers['cache-control']).toBe('no-cache');
    await app.close();
  });

  it('本地开发没有构建版本时 version 为 null，规则版本照常返回', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/version' });
    expect(res.json()).toEqual({ version: null, rulesVersion: RULES_VERSION });
  });
});
