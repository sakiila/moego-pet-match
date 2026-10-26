import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildAuthenticatedApp as buildApp } from './helpers.ts';
import { dailyManager } from '../src/services/pets.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => {
  ctx = await freshDatabase();
  await ctx.pool.query(`UPDATE pet_match.pets SET sticker_key = 'test/' || pet_id`);
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});

describe('高并发读取', () => {
  it('已有每日店长时，读取不等待选举锁', async () => {
    const now = new Date();
    const first = await dailyManager(ctx.pool, now);
    const client = await ctx.pool.connect();
    let reading: ReturnType<typeof dailyManager> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let outcome: unknown;
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`daily_manager:${first!.date}`]);
      reading = dailyManager(ctx.pool, now);
      outcome = await Promise.race([
        reading,
        new Promise(resolve => { timer = setTimeout(() => resolve('blocked'), 200); }),
      ]);
    } finally {
      clearTimeout(timer);
      await client.query('ROLLBACK');
      client.release();
      await reading;
    }
    expect(outcome).toEqual(first);
  });

  it('同一时刻的每日店长请求共用一次读取', async () => {
    await dailyManager(ctx.pool);
    await ctx.app.ready();
    let acquired = 0;
    const count = () => { acquired++; };
    ctx.pool.on('acquire', count);
    let responses;
    try {
      responses = await Promise.all(Array.from({ length: 30 }, () => ctx.app.inject('/api/manager')));
    } finally {
      ctx.pool.off('acquire', count);
    }
    expect(responses.every(r => r.statusCode === 200)).toBe(true);
    expect(new Set(responses.map(r => r.body)).size).toBe(1);
    expect(acquired).toBe(1);
  });

  it('30 个相同冷图片请求只回源一次，之后命中磁盘缓存', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pm-concurrent-'));
    let gets = 0;
    const image = Buffer.alloc(28_000, 1);
    const app = buildApp({
      pool: ctx.pool,
      images: {
        cache: new DiskCache(dir, 1_000_000),
        fetchAvatar: async () => null,
        store: {
          get: async () => {
            gets++;
            await new Promise(resolve => setTimeout(resolve, 40));
            return { body: image, contentType: 'image/png' };
          },
          put: async () => {},
          delete: async () => {},
        },
      },
    });
    try {
      await app.ready();
      const responses = await Promise.all(Array.from({ length: 30 }, () => app.inject('/img/pets/mochi/128')));
      expect(responses.every(r => r.statusCode === 200 && r.rawPayload.equals(image))).toBe(true);
      expect(gets).toBe(1);
      expect((await app.inject('/img/pets/mochi/128')).statusCode).toBe(200);
      expect(gets).toBe(1);
      await ctx.pool.query(`UPDATE pet_match.pets SET status = 'unpublished' WHERE pet_id = 'mochi'`);
      expect((await app.inject('/img/pets/mochi/128')).statusCode).toBe(404);
    } finally {
      await ctx.pool.query(`UPDATE pet_match.pets SET status = 'published' WHERE pet_id = 'mochi'`);
      await app.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('重复结算的数据库压力', () => {
  it('40 次相同并发提交共用一个事务，只累计一次', async () => {
    const game = (await ctx.app.inject({ method: 'POST', url: '/api/games', payload: { playerId: 'U_TEST_BOB', mode: 'normal' } })).json();
    const result = {
      rulesVersion: game.rulesVersion, completed: true, score: 300, clearedCells: 3,
      clearedByMultiplier: [3, 0, 0, 0, 0], rushSucceeded: false, maxChain: 1,
      toolsFired: 0, validMoves: 1, actedInLastSeconds: false,
      pets: game.lineup.map((p: { petId: string }, i: number) => ({ id: p.petId, served: i === 0 ? 3 : 0, firstServedSeq: i === 0 ? 1 : null })),
    };
    const app = buildApp({ pool: ctx.pool, settleHooks: { beforeCommit: () => new Promise(resolve => setTimeout(resolve, 50)) } });
    await app.ready();
    // 先建立测试会话；计数包括并发合并的两次身份读取和一次结算事务。
    await app.inject('/api/players/U_TEST_BOB');
    let acquired = 0;
    const count = () => { acquired++; };
    ctx.pool.on('acquire', count);
    try {
      const responses = await Promise.all(Array.from({ length: 40 }, () => app.inject({
        method: 'POST', url: `/api/games/${game.gameId}/result`, payload: { playerId: 'U_TEST_BOB', result },
      })));
      expect(responses.every(r => r.statusCode === 200)).toBe(true);
      for (const response of responses) expect(response.json()).toEqual(responses[0].json());
      expect(acquired).toBe(3);
    } finally {
      ctx.pool.off('acquire', count);
      await app.close();
    }
    const rows = (await ctx.pool.query(`SELECT completed_normal_games FROM pet_match.player_progress WHERE player_id = 'U_TEST_BOB'`)).rows;
    expect(rows[0].completed_normal_games).toBe(1);
    expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.game_results WHERE game_id = $1', [game.gameId])).rows[0].n).toBe(1);
  });
});
