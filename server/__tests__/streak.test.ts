import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RegisteredGame, ResultPayload } from '../../web/src/api/types.ts';
import { beijingDate } from '../src/services/pets.ts';
import { computeStreak } from '../src/services/streak.ts';
import { freshDatabase } from './helpers.ts';

describe('连续开工天数：纯计算', () => {
  it('今天开过工：连到今天', () => {
    expect(computeStreak(['2026-10-24', '2026-10-23', '2026-10-22'], '2026-10-24')).toEqual({ days: 3, today: true });
  });

  it('今天没开、昨天开过：连到昨天，标记今天未打卡', () => {
    expect(computeStreak(['2026-10-23', '2026-10-22'], '2026-10-24')).toEqual({ days: 2, today: false });
  });

  it('昨天也没开：归零', () => {
    expect(computeStreak(['2026-10-22', '2026-10-21'], '2026-10-24')).toEqual({ days: 0, today: false });
    expect(computeStreak([], '2026-10-24')).toEqual({ days: 0, today: false });
  });

  it('中间断一天只数最近一段；日期顺序与重复不影响', () => {
    expect(computeStreak(['2026-10-22', '2026-10-24', '2026-10-24', '2026-10-23', '2026-10-20'], '2026-10-24')).toEqual({ days: 3, today: true });
  });

  it('跨月跨年按自然日连续', () => {
    expect(computeStreak(['2027-01-01', '2026-12-31', '2026-12-30'], '2027-01-01')).toEqual({ days: 3, today: true });
  });
});

describe('连续开工天数：接口', () => {
  let ctx: Awaited<ReturnType<typeof freshDatabase>>;
  const daysAgo = (n: number) => beijingDate(new Date(Date.now() - n * 86_400_000));

  beforeAll(async () => {
    ctx = await freshDatabase();
  });
  afterAll(async () => {
    await ctx.app.close();
    await ctx.pool.end();
  });

  /** 直接写入某天一局已保存结果；moves 为该局有效操作数。 */
  async function played(player: string, boardDate: string, moves: number, mode = 'normal') {
    const g = await ctx.pool.query(
      `INSERT INTO pet_match.games (player_id, mode, rules_version, seed, lineup, board_date) VALUES ($1, $2, 1, 1, '{}', $3) RETURNING game_id`,
      [player, mode, boardDate],
    );
    await ctx.pool.query(
      `INSERT INTO pet_match.game_results (game_id, payload, payload_hash, score, counted, response) VALUES ($1, $2, $3, 0, false, '{}')`,
      [g.rows[0].game_id, JSON.stringify({ validMoves: moves }), `h-${g.rows[0].game_id}`],
    );
  }
  const player = async (id: string) => (await ctx.app.inject({ method: 'GET', url: `/api/players/${id}` })).json();
  async function register(playerId: string, mode = 'normal'): Promise<RegisteredGame> {
    const res = await ctx.app.inject({ method: 'POST', url: '/api/games', payload: { playerId, mode } });
    expect(res.statusCode).toBe(200);
    return res.json();
  }
  function result(game: RegisteredGame, validMoves: number): ResultPayload {
    return {
      rulesVersion: game.rulesVersion,
      completed: true,
      score: validMoves > 0 ? 1000 : 0,
      clearedCells: validMoves > 0 ? 10 : 0,
      clearedByMultiplier: [validMoves > 0 ? 10 : 0, 0, 0, 0, 0],
      rushSucceeded: false,
      maxChain: 0,
      toolsFired: 0,
      validMoves,
      actedInLastSeconds: false,
      pets: game.lineup.map((p, i) => ({ id: p.petId, served: i === 0 && validMoves > 0 ? 10 : 0, firstServedSeq: i === 0 && validMoves > 0 ? 1 : null })),
    };
  }
  const submit = (game: RegisteredGame, playerId: string, payload: ResultPayload) =>
    ctx.app.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, payload: { playerId, result: payload } });

  it('玩家资料带 streak：零操作局与未保存的局不算，鱼关算', async () => {
    expect((await player('U_TEST_SAM')).streak).toEqual({ days: 0, today: false });
    await played('U_TEST_SAM', daysAgo(2), 3);
    await played('U_TEST_SAM', daysAgo(1), 0); // 零操作：不算 → 断了
    expect((await player('U_TEST_SAM')).streak).toEqual({ days: 0, today: false });
    await played('U_TEST_SAM', daysAgo(1), 2, 'fish'); // 鱼关也算
    expect((await player('U_TEST_SAM')).streak).toEqual({ days: 2, today: false });
  });

  it('结算响应带 streak：当天第一局 firstToday，同天第二局不再是；昨天开过工则累加', async () => {
    await played('U_TEST_ALICE', daysAgo(1), 1);
    const g1 = await register('U_TEST_ALICE');
    const r1 = (await submit(g1, 'U_TEST_ALICE', result(g1, 5))).json();
    expect(r1.streak).toEqual({ days: 2, today: true, firstToday: true });
    const g2 = await register('U_TEST_ALICE');
    const r2 = (await submit(g2, 'U_TEST_ALICE', result(g2, 5))).json();
    expect(r2.streak).toEqual({ days: 2, today: true, firstToday: false });
    expect((await player('U_TEST_ALICE')).streak).toEqual({ days: 2, today: true });
  });

  it('零操作局结算：不打卡，streak 照旧', async () => {
    const g = await register('U_TEST_BOB');
    const r = (await submit(g, 'U_TEST_BOB', result(g, 0))).json();
    expect(r.streak).toEqual({ days: 0, today: false, firstToday: false });
  });

  it('重试同一局返回同一 streak 快照', async () => {
    const g = await register('U_TEST_ZHANG');
    const p = result(g, 2);
    const a = (await submit(g, 'U_TEST_ZHANG', p)).json();
    const b = (await submit(g, 'U_TEST_ZHANG', p)).json();
    expect(b.streak).toEqual(a.streak);
    expect(a.streak).toEqual({ days: 1, today: true, firstToday: true });
  });
});
