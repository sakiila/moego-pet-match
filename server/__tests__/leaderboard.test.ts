import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;

/** 直接写入个人最好（排行只依赖 best_scores）。 */
async function setBest(player: string, mode: string, score: number) {
  const g = await ctx.pool.query(
    `INSERT INTO pet_match.games (player_id, mode, rules_version, seed, lineup) VALUES ($1, $2, 1, 1, '{}') RETURNING game_id`,
    [player, mode],
  );
  await ctx.pool.query('INSERT INTO pet_match.best_scores (player_id, mode, score, game_id) VALUES ($1, $2, $3, $4)', [
    player,
    mode,
    score,
    g.rows[0].game_id,
  ]);
}

beforeAll(async () => {
  ctx = await freshDatabase();
  await setBest('U_TEST_ALICE', 'normal', 4980);
  await setBest('U_TEST_BOB', 'normal', 2480);
  await setBest('U_TEST_ZHANG', 'normal', 2480);
  await setBest('U_TEST_SAM', 'normal', 1200);
  await setBest('U_TEST_BOB', 'fish', 900);
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});

const board = async (qs: string) => (await ctx.app.inject({ method: 'GET', url: `/api/leaderboard?${qs}` })).json();

describe('排行榜', () => {
  it('同分并列：1、2、2、4', async () => {
    const view = await board('mode=normal&playerId=U_TEST_BOB');
    expect(view.entries.map((e: { rank: number; userId: string }) => [e.rank, e.userId])).toEqual([
      [1, 'U_TEST_ALICE'],
      [2, 'U_TEST_BOB'],
      [2, 'U_TEST_ZHANG'],
      [4, 'U_TEST_SAM'],
    ]);
    expect(view.me).toEqual({ rank: 2, userId: 'U_TEST_BOB', name: 'Bob', score: 2480 });
  });

  it('普通与鱼关分榜', async () => {
    const fish = await board('mode=fish&playerId=U_TEST_BOB');
    expect(fish.entries).toEqual([{ rank: 1, userId: 'U_TEST_BOB', name: 'Bob', score: 900 }]);
  });

  it('没有已保存成绩的玩家没有名次', async () => {
    expect((await board('mode=normal&playerId=U_TEST_LONG')).me).toBeNull();
    expect((await board('mode=fish&playerId=U_TEST_ALICE')).me).toBeNull();
  });

  it('离开名单的同事不再出现在榜上', async () => {
    await setBest('U_TEST_GONE', 'normal', 99999);
    const view = await board('mode=normal');
    expect(view.entries.some((e: { userId: string }) => e.userId === 'U_TEST_GONE')).toBe(false);
    expect(view.entries[0].userId).toBe('U_TEST_ALICE');
  });
});
