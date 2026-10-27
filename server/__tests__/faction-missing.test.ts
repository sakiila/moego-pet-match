import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RULES } from '../../web/src/engine/config.ts';
import { joinFaction, loadFaction } from '../src/services/faction.ts';
import { registerGame, settleGame } from '../src/services/games.ts';
import { freshDatabase } from './helpers.ts';

/** 生产迁移手动执行：代码先于 023 上线时，开局与结算照常，活动静默。 */
describe('阵营周表尚未迁移', () => {
  let ctx: Awaited<ReturnType<typeof freshDatabase>>;
  const DAY1 = new Date('2026-10-28T04:00:00Z');
  beforeAll(async () => {
    ctx = await freshDatabase();
    await ctx.pool.query('DROP TABLE pet_match.faction_contributions, pet_match.faction_members, pet_match.faction_results');
  });
  afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });

  it('开局、结算不受影响，活动隐藏，报名视为截止', async () => {
    const game = await registerGame(ctx.pool, 'U_TEST_BOB', 'normal', DAY1);
    const pets = game.lineup.map((p, i) => ({ id: p.petId, served: i === 0 ? 3 : 0, firstServedSeq: i === 0 ? 1 : null }));
    const res = await settleGame(ctx.pool, game.gameId, 'U_TEST_BOB', {
      rulesVersion: game.rulesVersion, completed: true, score: 3 * RULES.baseScore, clearedCells: 3, clearedByMultiplier: [3, 0, 0, 0, 0],
      rushSucceeded: false, maxChain: 1, toolsFired: 0, validMoves: 1, actedInLastSeconds: false, pets,
    });
    expect(res.faction).toBeUndefined();
    expect(await loadFaction(ctx.pool, 'U_TEST_BOB', DAY1)).toEqual({ phase: 'hidden' });
    await expect(joinFaction(ctx.pool, 'U_TEST_BOB', 'cat', DAY1)).rejects.toMatchObject({ code: 'closed' });
  });
});
