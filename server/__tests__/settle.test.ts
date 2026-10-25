import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RegisteredGame, ResultPayload } from '../../web/src/api/types.ts';
import { buildApp } from '../src/app.ts';
import { freshDatabase } from './helpers.ts';
import { RULES, RULES_VERSION } from '../../web/src/engine/config.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => {
  ctx = await freshDatabase();
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});

async function register(playerId: string, mode = 'normal'): Promise<RegisteredGame> {
  const res = await ctx.app.inject({ method: 'POST', url: '/api/games', payload: { playerId, mode } });
  expect(res.statusCode).toBe(200);
  return res.json();
}

/** 构造自洽结果：bym 为各倍率清除格数。 */
function result(game: RegisteredGame, opts: { bym?: number[]; rush?: boolean; validMoves?: number; served?: number[] } = {}): ResultPayload {
  const bym = opts.bym ?? [3, 3, 4, 0, 0];
  const cleared = bym.reduce((a, b) => a + b, 0);
  const served = opts.served ?? [3, 3, 4, 0, 0, 0];
  return {
    rulesVersion: game.rulesVersion,
    completed: true,
    score: bym.reduce((s, n, i) => s + n * (i + 1) * RULES.baseScore, 0) + (opts.rush ? RULES.rush.bonus : 0),
    clearedCells: cleared,
    clearedByMultiplier: bym,
    rushSucceeded: !!opts.rush,
    maxChain: 3,
    toolsFired: 0,
    validMoves: opts.validMoves ?? (cleared > 0 ? 1 : 0),
    actedInLastSeconds: false,
    pets: game.lineup.map((p, i) => ({ id: p.petId, served: served[i], firstServedSeq: served[i] > 0 ? i + 1 : null })),
  };
}

const submit = (app: typeof ctx.app, game: RegisteredGame, playerId: string, payload: ResultPayload) =>
  app.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, payload: { playerId, result: payload } });

const count = async (table: string) => (await ctx.pool.query(`SELECT count(*)::int AS n FROM pet_match.${table}`)).rows[0].n;
const progress = async (player: string) =>
  (await ctx.pool.query('SELECT completed_normal_games, fish_unlocked_at FROM pet_match.player_progress WHERE player_id = $1', [player])).rows[0];

describe('登记新局', () => {
  it('名单内玩家得到种子与 6 只上架宠物', async () => {
    const game = await register('U_TEST_BOB');
    expect(game.lineup).toHaveLength(6);
    expect(game.seed).toBeGreaterThanOrEqual(0);
    expect(game.rulesVersion).toBe(RULES_VERSION);
  });

  it('名单外玩家不能登记；未解锁不能开鱼局', async () => {
    expect((await ctx.app.inject({ method: 'POST', url: '/api/games', payload: { playerId: 'U_TEST_GUEST', mode: 'normal' } })).statusCode).toBe(404);
    expect((await ctx.app.inject({ method: 'POST', url: '/api/games', payload: { playerId: 'U_TEST_ALICE', mode: 'fish' } })).statusCode).toBe(403);
  });
});

describe('统一结算', () => {
  it('首次结算：记录成绩、个人最好、新收集与局数', async () => {
    const game = await register('U_TEST_ALICE');
    const res = await submit(ctx.app, game, 'U_TEST_ALICE', result(game));
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.score).toBe(2100);
    expect(body.personalBest).toEqual({ previous: null, current: 2100, isNew: true });
    expect(body.newCollected.map((p: { petId: string }) => p.petId)).toEqual(game.lineup.slice(0, 3).map((p) => p.petId));
    expect(body.progress).toEqual({ completedNormalGames: 1, fishUnlocked: false, unlockedNow: false, counted: true });
  });

  it('两个请求同时提交同一局只记一次，返回同一结果', async () => {
    // 让第一个事务提交前停 300 ms，确保第二个请求在它未提交时到达
    const slow = buildApp({ pool: ctx.pool, settleHooks: { beforeCommit: () => new Promise((r) => setTimeout(r, 300)) } });
    const game = await register('U_TEST_ZHANG');
    const payload = result(game);
    const first = submit(slow, game, 'U_TEST_ZHANG', payload);
    await new Promise((r) => setTimeout(r, 50));
    const [a, b] = await Promise.all([first, submit(slow, game, 'U_TEST_ZHANG', payload)]);
    await slow.close();
    expect(a.statusCode).toBe(200);
    expect(b.statusCode).toBe(200);
    expect(a.json()).toEqual(b.json());
    expect((await progress('U_TEST_ZHANG')).completed_normal_games).toBe(1);
    expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.game_results WHERE game_id = $1', [game.gameId])).rows[0].n).toBe(1);
  });

  it('服务端已保存但响应丢失：当前报告重试返回原结果，不重复计数', async () => {
    const game = await register('U_TEST_SAM');
    const payload = result(game);
    const first = (await submit(ctx.app, game, 'U_TEST_SAM', payload)).json();
    const retry = await submit(ctx.app, game, 'U_TEST_SAM', payload);
    expect(retry.json()).toEqual(first);
    expect((await progress('U_TEST_SAM')).completed_normal_games).toBe(1);
  });

  it('同一对局编号提交不同内容返回 409，不改写原结果', async () => {
    const game = await register('U_TEST_SAM');
    await submit(ctx.app, game, 'U_TEST_SAM', result(game));
    const other = await submit(ctx.app, game, 'U_TEST_SAM', result(game, { bym: [9, 0, 0, 0, 0], served: [9, 0, 0, 0, 0, 0] }));
    expect(other.statusCode).toBe(409);
    expect((await ctx.pool.query('SELECT score FROM pet_match.game_results WHERE game_id = $1', [game.gameId])).rows[0].score).toBe(2100);
  });

  it('重试不能改写原局归属：换身份提交返回 409', async () => {
    const game = await register('U_TEST_BOB');
    expect((await submit(ctx.app, game, 'U_TEST_ALICE', result(game))).statusCode).toBe(409);
  });

  it('结算中途失败不留下任何部分进度', async () => {
    const failing = buildApp({
      pool: ctx.pool,
      settleHooks: {
        beforeCommit: async () => {
          throw new Error('injected failure');
        },
      },
    });
    const game = await register('U_TEST_LONG');
    const before = { results: await count('game_results'), best: await count('best_scores'), coll: await count('collections') };
    const res = await submit(failing, game, 'U_TEST_LONG', result(game));
    expect(res.statusCode).toBe(503);
    expect({ results: await count('game_results'), best: await count('best_scores'), coll: await count('collections') }).toEqual(before);
    expect(await progress('U_TEST_LONG')).toBeUndefined();
    // 恢复后同一局重试成功且只记一次
    expect((await submit(ctx.app, game, 'U_TEST_LONG', result(game))).statusCode).toBe(200);
    expect((await progress('U_TEST_LONG')).completed_normal_games).toBe(1);
    await failing.close();
  });

  it('基础校验：分数与倍率汇总对不上、阵容外宠物、零操作却有消除都拒绝且不计入', async () => {
    const game = await register('U_TEST_BOB');
    const bad = { ...result(game), score: 999 };
    expect((await submit(ctx.app, game, 'U_TEST_BOB', bad)).json()).toEqual({ error: 'invalid', detail: 'score' });
    const outsider = result(game);
    outsider.pets[0] = { ...outsider.pets[0], id: 'not-in-lineup' };
    expect((await submit(ctx.app, game, 'U_TEST_BOB', outsider)).json()).toEqual({ error: 'invalid', detail: 'lineup' });
    expect((await submit(ctx.app, game, 'U_TEST_BOB', result(game, { validMoves: 0 }))).json()).toEqual({ error: 'invalid', detail: 'no_moves' });
    expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.game_results WHERE game_id = $1', [game.gameId])).rows[0].n).toBe(0);
  });

  it('零有效操作的完整局保存成绩但不计入三局进度', async () => {
    const game = await register('U_TEST_BOB');
    const res = (await submit(ctx.app, game, 'U_TEST_BOB', result(game, { bym: [0, 0, 0, 0, 0], served: [0, 0, 0, 0, 0, 0], validMoves: 0 }))).json();
    expect(res.score).toBe(0);
    expect(res.progress).toMatchObject({ completedNormalGames: 0, counted: false });
    expect(res.newCollected).toEqual([]);
  });

  it('第 3 个计入的普通局恰好解锁一次鱼关，之后可登记鱼局', async () => {
    const outcomes = [];
    for (let i = 0; i < 4; i++) {
      const game = await register('U_TEST_BOB');
      outcomes.push((await submit(ctx.app, game, 'U_TEST_BOB', result(game))).json().progress);
    }
    expect(outcomes.map((p) => [p.completedNormalGames, p.unlockedNow, p.fishUnlocked])).toEqual([
      [1, false, false],
      [2, false, false],
      [3, true, true],
      [4, false, true],
    ]);
    expect((await register('U_TEST_BOB', 'fish')).mode).toBe('fish');
  });

  it('个人最好只在更高时更新；鱼局成绩不进普通榜且不计三局进度', async () => {
    const low = await register('U_TEST_BOB');
    const r = (await submit(ctx.app, low, 'U_TEST_BOB', result(low, { bym: [3, 0, 0, 0, 0], served: [3, 0, 0, 0, 0, 0] }))).json();
    expect(r.personalBest).toEqual({ previous: 2100, current: 2100, isNew: false });
    const fish = await register('U_TEST_BOB', 'fish');
    const f = (await submit(ctx.app, fish, 'U_TEST_BOB', result(fish))).json();
    expect(f.personalBest).toEqual({ previous: null, current: 2100, isNew: true });
    expect(f.progress.counted).toBe(false);
    expect(f.newCollected).toEqual([]);
  });
});

describe('玩家记录读取', () => {
  it('刷新后读取已保存的个人最好与进度', async () => {
    const res = (await ctx.app.inject({ method: 'GET', url: '/api/players/U_TEST_BOB' })).json();
    expect(res.best).toEqual({ normal: 2100, fish: 2100 });
    expect(res.progress).toEqual({ completedNormalGames: 5, fishUnlocked: true });
  });
});

describe('登记的阵容来源', () => {
  it('普通局阵容只来自上架宠物，鱼局阵容是六种鱼色', async () => {
    const normal = await register('U_TEST_ALICE');
    const published = (await ctx.pool.query(`SELECT pet_id FROM pet_match.pets WHERE status = 'published'`)).rows.map((r) => r.pet_id);
    expect(normal.lineup.every((p) => published.includes(p.petId))).toBe(true);
    expect(normal.ownPetIds).toEqual([]);
    const fish = await register('U_TEST_BOB', 'fish');
    expect(fish.lineup.map((p) => p.petId).sort()).toEqual(
      ['blue', 'green', 'orange', 'purple', 'red', 'yellow'].map((c) => `fish_color_${c}`),
    );
    expect(fish.lineup[0].nameEn).toBeTruthy();
  });

  it('玩家拥有的宠物按规则可能入选，并在 ownPetIds 中标出', async () => {
    await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_SAM' WHERE pet_id IN ('mochi', 'tofu')`);
    // 不带自家宠物时也要有足够的他人宠物补满 6 种
    await ctx.pool.query(`INSERT INTO pet_match.pets (pet_id, name, status) VALUES ('extra1', 'Extra1', 'published'), ('extra2', 'Extra2', 'published')`);
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const game = await register('U_TEST_SAM');
      expect(game.ownPetIds.length).toBeLessThanOrEqual(2);
      expect(game.ownPetIds.every((id) => game.lineup.some((p) => p.petId === id))).toBe(true);
      seen.add(game.ownPetIds.length);
    }
    // 40 次中 0、1 只都应出现（2 只的概率 20%，大概率也出现）
    expect(seen.has(0) && seen.has(1)).toBe(true);
  });
});
