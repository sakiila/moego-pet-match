import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dailySeed } from '../src/services/dailyBoard.ts';
import { registerGame } from '../src/services/games.ts';
import { beijingDate } from '../src/services/pets.ts';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;

beforeAll(async () => {
  ctx = await freshDatabase();
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});

/** 直接写入一局已结算的对局（日榜只看 games.board_date 与 game_results.score）。 */
async function settled(player: string, mode: string, boardDate: string, score: number) {
  const g = await ctx.pool.query(
    `INSERT INTO pet_match.games (player_id, mode, rules_version, seed, lineup, board_date) VALUES ($1, $2, 1, 1, '{}', $3) RETURNING game_id`,
    [player, mode, boardDate],
  );
  await ctx.pool.query(
    `INSERT INTO pet_match.game_results (game_id, payload, payload_hash, score, counted, response) VALUES ($1, '{}', $2, $3, true, '{}')`,
    [g.rows[0].game_id, `h-${g.rows[0].game_id}`, score],
  );
}

const board = async (qs: string) => (await ctx.app.inject({ method: 'GET', url: `/api/leaderboard?${qs}` })).json();
const pairs = (view: { entries: { rank: number; userId: string; score: number }[] }) => view.entries.map((e) => [e.rank, e.userId, e.score]);

describe('每日种子', () => {
  it('同日同模式相同，跨日或跨模式不同，落在 31 位非负整数内', () => {
    expect(dailySeed('normal', '2026-10-24')).toBe(dailySeed('normal', '2026-10-24'));
    expect(dailySeed('normal', '2026-10-24')).not.toBe(dailySeed('normal', '2026-10-25'));
    expect(dailySeed('normal', '2026-10-24')).not.toBe(dailySeed('fish', '2026-10-24'));
    for (const d of ['2026-10-24', '2026-11-01', '2027-02-28']) {
      const s = dailySeed('normal', d);
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(2 ** 31);
    }
  });

  it('登记写入北京日期，同一天全员同一种子，跨日不同', async () => {
    const dayA = new Date('2026-10-24T03:00:00+08:00');
    const dayALate = new Date('2026-10-24T23:59:30+08:00');
    const dayB = new Date('2026-10-25T00:00:30+08:00');
    const bob = await registerGame(ctx.pool, 'U_TEST_BOB', 'normal', dayA);
    const alice = await registerGame(ctx.pool, 'U_TEST_ALICE', 'normal', dayALate);
    const bobNext = await registerGame(ctx.pool, 'U_TEST_BOB', 'normal', dayB);
    expect(bob.seed).toBe(alice.seed);
    expect(bob.seed).toBe(dailySeed('normal', '2026-10-24'));
    expect(bobNext.seed).toBe(dailySeed('normal', '2026-10-25'));
    expect(bobNext.seed).not.toBe(bob.seed);
    const dates = await ctx.pool.query(`SELECT game_id, board_date::text AS d FROM pet_match.games WHERE game_id = ANY($1)`, [[bob.gameId, alice.gameId, bobNext.gameId]]);
    const byId = Object.fromEntries(dates.rows.map((r) => [r.game_id, r.d]));
    expect(byId[bob.gameId]).toBe('2026-10-24');
    expect(byId[alice.gameId]).toBe('2026-10-24');
    expect(byId[bobNext.gameId]).toBe('2026-10-25');
  });

  it('默认用当前北京日期', async () => {
    const g = await registerGame(ctx.pool, 'U_TEST_SAM', 'normal');
    expect(g.seed).toBe(dailySeed('normal', beijingDate()));
  });
});

describe('今日榜', () => {
  const today = beijingDate();
  const yesterday = beijingDate(new Date(Date.now() - 86_400_000));

  beforeAll(async () => {
    await settled('U_TEST_ALICE', 'normal', today, 3000);
    await settled('U_TEST_ALICE', 'normal', today, 4100); // 同一人当天最高
    await settled('U_TEST_BOB', 'normal', today, 2480);
    await settled('U_TEST_ZHANG', 'normal', today, 2480); // 与 Bob 并列
    await settled('U_TEST_SAM', 'normal', today, 1200);
    await settled('U_TEST_LONG', 'normal', yesterday, 9999); // 昨天的不进今日榜
    await settled('U_TEST_GONE', 'normal', today, 8888); // 已离开名单
    await settled('U_TEST_BOB', 'fish', today, 700);
  });

  it('只含今天、每人取最高、同分并列，并带上日期与范围', async () => {
    const view = await board(`mode=normal&scope=today&playerId=U_TEST_BOB`);
    expect(view.scope).toBe('today');
    expect(view.date).toBe(today);
    expect(pairs(view)).toEqual([
      [1, 'U_TEST_ALICE', 4100],
      [2, 'U_TEST_BOB', 2480],
      [2, 'U_TEST_ZHANG', 2480],
      [4, 'U_TEST_SAM', 1200],
    ]);
    expect(view.me).toMatchObject({ rank: 2, userId: 'U_TEST_BOB', score: 2480 });
  });

  it('普通与鱼关分榜；今天没成绩的玩家没有名次', async () => {
    const fish = await board('mode=fish&scope=today&playerId=U_TEST_BOB');
    expect(pairs(fish)).toEqual([[1, 'U_TEST_BOB', 700]]);
    expect((await board('mode=normal&scope=today&playerId=U_TEST_LONG')).me).toBeNull();
  });

  it('不带 scope 仍是总榜（个人最好），不受今日对局影响', async () => {
    const view = await board('mode=normal&playerId=U_TEST_BOB');
    expect(view.scope).toBe('all');
    expect(view.entries).toEqual([]);
  });

  it('非法 scope 返回 400', async () => {
    expect((await ctx.app.inject({ method: 'GET', url: '/api/leaderboard?mode=normal&scope=week' })).statusCode).toBe(400);
  });
});
