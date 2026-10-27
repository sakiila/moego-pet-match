import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FactionView, ResultPayload } from '../../web/src/api/types.ts';
import { RULES } from '../../web/src/engine/config.ts';
import { createRng } from '../../web/src/engine/rng.ts';
import { FACTION_EVENT, balanceFactors, factionLead, factionPhase, factionSpecies, gamePoints } from '../../web/src/game/factionWeek.ts';
import { inTransaction } from '../src/db/pool.ts';
import { readAchievements } from '../src/services/achievements.ts';
import { joinFaction, loadFaction, settleFactionEvent } from '../src/services/faction.ts';
import { registerGame, settleGame } from '../src/services/games.ts';
import { sampleLineup, type CandidatePet } from '../src/services/lineup.ts';
import { freshDatabase } from './helpers.ts';

/** 活动周内的固定时刻；与真实日期无关，测试不会随活动结束失效。 */
const DAY1 = new Date('2026-10-28T04:00:00Z'); // 北京 10-28 12:00
const DAY2 = new Date('2026-10-29T04:00:00Z');
const FOG = new Date('2026-11-02T04:00:00Z');
const AFTER = new Date('2026-11-03T02:00:00Z');

describe('阵营周规则（纯函数）', () => {
  it('物种归一：括号里的品种不影响，猫狗以外为 null', () => {
    expect(factionSpecies('猫（布偶）')).toBe('cat');
    expect(factionSpecies('Dogs')).toBe('dog');
    expect(factionSpecies('鹦鹉')).toBeNull();
    expect(factionSpecies(null)).toBeNull();
  });
  it('单局积分：本阵营物种 2 分、对方 1 分、其他物种不计', () => {
    expect(gamePoints('cat', [{ species: 'cat', served: 10 }, { species: 'dog', served: 4 }, { species: null, served: 9 }]))
      .toEqual({ ownCells: 10, otherCells: 4, points: 24 });
  });
  it('平衡系数按活跃人数，人少一方最多乘 1.3', () => {
    expect(balanceFactors({ cat: 10, dog: 10 })).toEqual({ cat: 1, dog: 1 });
    expect(balanceFactors({ cat: 10, dog: 9 }).dog).toBeCloseTo(10 / 9);
    expect(balanceFactors({ cat: 3, dog: 10 })).toEqual({ cat: 1.3, dog: 1 });
    expect(balanceFactors({ cat: 0, dog: 4 })).toEqual({ cat: 1, dog: 1 });
  });
  it('领先程度：0.5% 内平局，10% 内小幅领先', () => {
    expect(factionLead({ cat: 1000, dog: 996 })).toEqual({ leader: null, level: 'even' });
    expect(factionLead({ cat: 1000, dog: 950 })).toEqual({ leader: 'cat', level: 'slight' });
    expect(factionLead({ cat: 500, dog: 1000 })).toEqual({ leader: 'dog', level: 'clear' });
    expect(factionLead({ cat: 0, dog: 0 }).leader).toBeNull();
  });
  it('阶段：开赛前隐藏，最后一天迷雾，收官后显示结果一周', () => {
    const at = (iso: string) => { const d = new Date(iso); return factionPhase(FACTION_EVENT, new Date(d.getTime() + 8 * 3600_000).toISOString().slice(0, 10), d); };
    expect(at('2026-10-26T04:00:00Z')).toBe('hidden');
    expect(at('2026-10-27T04:00:00Z')).toBe('active');
    expect(at('2026-11-01T15:59:00Z')).toBe('active');
    expect(at('2026-11-01T16:00:00Z')).toBe('fog');
    expect(at('2026-11-02T16:05:00Z')).toBe('fog'); // 11-03 00:05，尚未收官
    expect(at('2026-11-02T16:15:00Z')).toBe('ended');
    expect(at('2026-11-09T15:59:00Z')).toBe('ended');
    expect(at('2026-11-09T16:00:00Z')).toBe('hidden');
  });
});

describe('阵营周阵容配额', () => {
  const pets: CandidatePet[] = [
    ...Array.from({ length: 8 }, (_, i) => ({ petId: `c${i}`, ownerUserId: `U${i}`, species: 'cat' as const })),
    ...Array.from({ length: 8 }, (_, i) => ({ petId: `d${i}`, ownerUserId: `U${i}`, species: 'dog' as const })),
    ...Array.from({ length: 4 }, (_, i) => ({ petId: `b${i}`, ownerUserId: `U${i}`, species: null })),
  ];
  const rng = createRng(7);
  const random = () => rng.next();
  const count = (ids: string[], prefix: string) => ids.filter((id) => id.startsWith(prefix)).length;

  it('报名玩家每局 3 猫 3 狗，自家猫占猫名额', () => {
    const mine = [...pets, { petId: 'cMine', ownerUserId: 'ME', species: 'cat' as const }];
    for (let i = 0; i < 500; i++) {
      const { lineup } = sampleLineup(mine, 'ME', new Set(), random, 3);
      expect(lineup).toHaveLength(6);
      expect(count(lineup, 'c')).toBe(3);
      expect(count(lineup, 'd')).toBe(3);
    }
  });
  it('自家鸟本期不入选', () => {
    const mine = [...pets, { petId: 'bMine', ownerUserId: 'ME', species: null }];
    for (let i = 0; i < 200; i++) expect(sampleLineup(mine, 'ME', new Set(), random, 3).lineup).not.toContain('bMine');
  });
  it('猫不足 3 只时用狗补满，猫狗都不够才用其他物种', () => {
    const few = pets.filter((p) => !['c2', 'c3', 'c4', 'c5', 'c6', 'c7'].includes(p.petId));
    const { lineup } = sampleLineup(few, 'ME', new Set(), random, 3);
    expect(count(lineup, 'c')).toBe(2);
    expect(count(lineup, 'd')).toBe(4);
    const tiny = pets.filter((p) => ['c0', 'd0', 'd1', 'b0', 'b1', 'b2', 'b3'].includes(p.petId));
    expect(count(sampleLineup(tiny, 'ME', new Set(), random, 3).lineup, 'b')).toBe(3);
  });
  it('不传配额时与原抽样一致，可抽到其他物种', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) sampleLineup(pets, 'ME', new Set(), random).lineup.forEach((id) => seen.add(id[0]));
    expect(seen.has('b')).toBe(true);
  });
});

describe('阵营周报名、计分与收官', () => {
  let ctx: Awaited<ReturnType<typeof freshDatabase>>;
  beforeAll(async () => {
    ctx = await freshDatabase();
    await ctx.pool.query('DELETE FROM pet_match.pets');
    const rows = [
      ...Array.from({ length: 5 }, (_, i) => [`c${i}`, i === 0 ? '猫（布偶）' : '猫']),
      ...Array.from({ length: 5 }, (_, i) => [`d${i}`, '狗']),
      ['b0', '鹦鹉'], ['b1', '兔'],
    ];
    for (const [id, species] of rows) await ctx.pool.query(`INSERT INTO pet_match.pets(pet_id,name,status,species) VALUES($1,$1,'published',$2)`, [id, species]);
  });
  afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });

  /** 按阵容给每只宠物服务 served(id) 格，生成自洽的结果。 */
  const payloadFor = (lineup: string[], served: (id: string) => number, validMoves = 1): ResultPayload => {
    const cells = lineup.map(served);
    const total = cells.reduce((a, b) => a + b, 0);
    return {
      rulesVersion: RULES_VERSION_OF(), completed: true, score: total * RULES.baseScore, clearedCells: total,
      clearedByMultiplier: [total, 0, 0, 0, 0], rushSucceeded: false, maxChain: 1, toolsFired: 0, validMoves, actedInLastSeconds: false,
      pets: lineup.map((id, i) => ({ id, served: cells[i], firstServedSeq: cells[i] ? 1 : null })),
    };
  };
  let rulesVersion = 0;
  const RULES_VERSION_OF = () => rulesVersion;
  const play = async (player: string, now: Date, served: (id: string) => number = () => 3, validMoves = 1) => {
    const game = await registerGame(ctx.pool, player, 'normal', now);
    rulesVersion = game.rulesVersion;
    const lineup = game.lineup.map((p) => p.petId);
    return { game, lineup, res: await settleGame(ctx.pool, game.gameId, player, payloadFor(lineup, served, validMoves)) };
  };
  const view = async (player: string, now: Date) => (await loadFaction(ctx.pool, player, now)) as FactionView;

  it('报名前的对局不计分，也不按配额抽阵容', async () => {
    const { res } = await play('U_TEST_BOB', DAY1);
    expect(res.faction).toBeUndefined();
    expect((await view('U_TEST_BOB', DAY1)).me).toEqual({ faction: null, points: 0, todayLeft: null });
  });

  it('报名幂等，不能换边；活动外不能报名', async () => {
    await joinFaction(ctx.pool, 'U_TEST_BOB', 'cat', DAY1);
    await joinFaction(ctx.pool, 'U_TEST_BOB', 'cat', DAY1);
    await expect(joinFaction(ctx.pool, 'U_TEST_BOB', 'dog', DAY1)).rejects.toMatchObject({ code: 'other_faction' });
    await expect(joinFaction(ctx.pool, 'U_TEST_ALICE', 'dog', AFTER)).rejects.toMatchObject({ code: 'closed' });
    await expect(joinFaction(ctx.pool, 'U_TEST_ALICE', 'dog', new Date('2026-10-26T04:00:00Z'))).rejects.toMatchObject({ code: 'closed' });
    await joinFaction(ctx.pool, 'U_TEST_ALICE', 'dog', DAY1);
    await joinFaction(ctx.pool, 'U_TEST_ZHANG', 'dog', DAY1);
  });

  it('报名后按 3 猫 3 狗抽阵容，本阵营物种 2 分、对方 1 分；重试不重复计分', async () => {
    const { game, lineup, res } = await play('U_TEST_BOB', DAY1, (id) => (id.startsWith('c') ? 4 : 2));
    expect(lineup.filter((id) => id.startsWith('c'))).toHaveLength(3);
    expect(lineup.filter((id) => id.startsWith('d'))).toHaveLength(3);
    expect(res.faction).toEqual({ faction: 'cat', points: 3 * 4 * 2 + 3 * 2 * 1, capped: false });
    const again = await settleGame(ctx.pool, game.gameId, 'U_TEST_BOB', payloadFor(lineup, (id) => (id.startsWith('c') ? 4 : 2)));
    expect(again.faction).toEqual(res.faction);
    expect((await view('U_TEST_BOB', DAY1)).me).toEqual({ faction: 'cat', points: 30, todayLeft: 4 });
  });

  it('零操作局和鱼关不计；每天只计前 5 局，第 6 局标记已满', async () => {
    expect((await play('U_TEST_BOB', DAY1, () => 0, 0)).res.faction).toBeUndefined();
    await ctx.pool.query("INSERT INTO pet_match.player_progress(player_id,completed_normal_games,fish_unlocked_at) VALUES('U_TEST_BOB',3,now()) ON CONFLICT (player_id) DO UPDATE SET fish_unlocked_at=now()");
    const fish = await registerGame(ctx.pool, 'U_TEST_BOB', 'fish', DAY1);
    const fishLineup = fish.lineup.map((p) => p.petId);
    expect((await settleGame(ctx.pool, fish.gameId, 'U_TEST_BOB', payloadFor(fishLineup, () => 3))).faction).toBeUndefined();
    for (let i = 0; i < 4; i++) expect((await play('U_TEST_BOB', DAY1)).res.faction?.capped).toBe(false);
    expect((await view('U_TEST_BOB', DAY1)).me.todayLeft).toBe(0);
    expect((await play('U_TEST_BOB', DAY1)).res.faction).toEqual({ faction: 'cat', points: 0, capped: true });
    // 第二天重新计数
    expect((await play('U_TEST_BOB', DAY2)).res.faction?.capped).toBe(false);
  });

  it('总分按人数平衡；迷雾期不给数字；昨日看点', async () => {
    await play('U_TEST_ALICE', DAY1, () => 5);
    await play('U_TEST_ZHANG', DAY2, () => 1);
    const live = await view('U_TEST_ALICE', DAY2);
    expect(live.phase).toBe('active');
    expect(live.sides.cat).toMatchObject({ members: 1, active: 1, factor: 1.3, points: 30 + 4 * 27 + 27 });
    expect(live.sides.dog).toMatchObject({ members: 2, active: 2, factor: 1 });
    expect(live.sides.cat.adjusted).toBe(Math.round(165 * 1.3));
    expect(live.yesterday?.stars.cat?.userId).toBe('U_TEST_BOB');
    expect(live.yesterday?.stars.dog?.userId).toBe('U_TEST_ALICE');
    expect(live.yesterday?.pets.cat?.petId).toMatch(/^c/);
    const fog = await view('U_TEST_ALICE', FOG);
    expect(fog.phase).toBe('fog');
    expect(fog.sides.cat.points).toBeNull();
    expect(fog.sides.dog.adjusted).toBeNull();
    expect(fog.lead.leader).toBe('cat');
    expect(fog.me.points).toBeGreaterThan(0);
  });

  it('收官前不结算；收官后胜方计过分的成员获得限时传奇徽章，只结算一次', async () => {
    await joinFaction(ctx.pool, 'U_TEST_SAM', 'cat', DAY2); // 报名但没计过分
    expect(await settleFactionEvent(ctx.pool, FOG)).toBeNull();
    const first = await settleFactionEvent(ctx.pool, AFTER);
    expect(first?.winner).toBe('cat');
    expect(await settleFactionEvent(ctx.pool, AFTER)).toEqual(first);
    const titles = async (player: string) => (await inTransaction(ctx.pool, (c) => readAchievements(c, player))).achievements;
    expect((await titles('U_TEST_BOB')).find((a) => a.id === 'meowchamp26')?.unlockedAt).toBeTruthy();
    expect((await titles('U_TEST_SAM')).some((a) => a.id === 'meowchamp26')).toBe(false);
    expect(await titles('U_TEST_ALICE')).toHaveLength(8);
    const bob = await view('U_TEST_BOB', AFTER);
    expect(bob.phase).toBe('ended');
    expect(bob.result).toMatchObject({ winner: 'cat', badge: 'meowchamp26' });
    expect(bob.result?.top.cat[0].userId).toBe('U_TEST_BOB');
    expect((await view('U_TEST_ALICE', AFTER)).result?.badge).toBeNull();
    // 收官后结算的局不再计分
    await ctx.pool.query("UPDATE pet_match.games SET board_date='2026-11-02' WHERE player_id='U_TEST_ZHANG'");
    expect((await play('U_TEST_ZHANG', FOG)).res.faction).toBeUndefined();
    // 可以佩戴
    const wear = await ctx.app.inject({ method: 'PATCH', url: '/api/players/U_TEST_BOB/title', payload: { title: 'meowchamp26' } });
    expect(wear.json().equippedTitle).toBe('meowchamp26');
  });

  it('接口：必须登录本人，参数校验，换边返回 409', async () => {
    expect((await ctx.app.inject({ method: 'GET', url: '/api/faction' })).statusCode).toBe(400);
    expect((await ctx.app.inject({ method: 'POST', url: '/api/faction/join', payload: { playerId: 'U_TEST_BOB', faction: 'bird' } })).statusCode).toBe(400);
    expect((await ctx.app.inject({ method: 'GET', url: '/api/faction?playerId=U_TEST_BOB', headers: { cookie: 'pet_match_session=nope' } })).statusCode).toBe(401);
    expect((await ctx.app.inject({ method: 'GET', url: '/api/faction?playerId=U_TEST_BOB' })).statusCode).toBe(200);
  });
});
