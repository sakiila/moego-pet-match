import { describe, expect, it } from 'vitest';
import { createRng } from '../../web/src/engine/rng.ts';
import { LINEUP_WEIGHTS, sampleLineup, type CandidatePet } from '../src/services/lineup.ts';

const others: CandidatePet[] = Array.from({ length: 40 }, (_, i) => ({ petId: `o${i}`, ownerUserId: `U${i % 20}` }));
const own = (n: number): CandidatePet[] => Array.from({ length: n }, (_, i) => ({ petId: `me${i}`, ownerUserId: 'ME' }));

function run(pets: CandidatePet[], collected: Set<string>, trials = 20_000) {
  const rng = createRng(12345);
  const random = () => rng.next();
  const ownCounts = [0, 0, 0, 0];
  const picks = new Map<string, number>();
  for (let i = 0; i < trials; i++) {
    const { lineup, own: o } = sampleLineup(pets, 'ME', collected, random);
    expect(lineup).toHaveLength(6);
    expect(new Set(lineup).size).toBe(6);
    ownCounts[o.length]++;
    for (const id of lineup) picks.set(id, (picks.get(id) ?? 0) + 1);
  }
  return { ownCounts: ownCounts.map((c) => c / trials), picks };
}

describe('阵容抽样', () => {
  it('只有 1 只自家宠物：约 75% 入选', () => {
    const { ownCounts } = run([...own(1), ...others], new Set());
    expect(ownCounts[1]).toBeCloseTo(LINEUP_WEIGHTS.ownSingle, 1);
    expect(ownCounts[2]).toBe(0);
  });

  it('有 ≥2 只自家宠物：约 65% 带 1 只、20% 带 2 只、15% 不带，从不超过 2 只', () => {
    const { ownCounts } = run([...own(4), ...others], new Set());
    expect(ownCounts[1]).toBeCloseTo(0.65, 1);
    expect(ownCounts[2]).toBeCloseTo(0.2, 1);
    expect(ownCounts[0]).toBeCloseTo(0.15, 1);
    expect(ownCounts[3]).toBe(0);
  });

  it('没有自家宠物时 6 只全部来自他人', () => {
    const { ownCounts } = run(others, new Set(), 2000);
    expect(ownCounts[0]).toBe(1);
  });

  it('补位按未收集 : 已收集 = 2 : 1 加权', () => {
    const collected = new Set(others.slice(0, 20).map((p) => p.petId));
    const { picks } = run(others, collected);
    const avg = (ids: string[]) => ids.reduce((s, id) => s + (picks.get(id) ?? 0), 0) / ids.length;
    const ratio = avg(others.slice(20).map((p) => p.petId)) / avg(others.slice(0, 20).map((p) => p.petId));
    // 无放回抽 6/40 时，比例略低于权重比 2
    expect(ratio).toBeGreaterThan(1.7);
    expect(ratio).toBeLessThan(2.1);
  });

  it('全部收集后回到等权', () => {
    const { picks } = run(others, new Set(others.map((p) => p.petId)));
    const counts = others.map((p) => picks.get(p.petId) ?? 0);
    expect(Math.max(...counts) / Math.min(...counts)).toBeLessThan(1.25);
  });
});

describe('阵容抽样 · 毛色错开', () => {
  // 40 只分成 8 个毛色簇，每簇 5 只（簇内距离 < 阈值，簇间远大于阈值）
  const coatOfCluster = (k: number, j: number): CandidatePet['coat'] => [20 + k * 10, k % 2 ? 15 : -15, j, k === 0 ? 0.8 : 0, k === 7 ? 0.6 : 0];
  const clustered: CandidatePet[] = others.map((p, i) => ({ ...p, coat: coatOfCluster(Math.floor(i / 5), i % 5) }));
  const clusterOf = (id: string) => Math.floor(Number(id.slice(1)) / 5);

  function lookAlikePairs(pets: CandidatePet[], collected = new Set<string>(), trials = 20_000) {
    const rng = createRng(777);
    const random = () => rng.next();
    let pairs = 0;
    const picks = new Map<string, number>();
    for (let t = 0; t < trials; t++) {
      const { lineup } = sampleLineup(pets, 'ME', collected, random);
      expect(lineup).toHaveLength(6);
      const ks = lineup.filter((id) => id.startsWith('o')).map(clusterOf);
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (ks[i] === ks[j]) pairs++;
      for (const id of lineup) picks.set(id, (picks.get(id) ?? 0) + 1);
    }
    return { pairs: pairs / trials, picks };
  }

  it('同局外观相近的组合明显减少', () => {
    const without = lookAlikePairs(others.map((p) => ({ ...p })));
    const withCoat = lookAlikePairs(clustered);
    // 不降权时每局约 15 × 4/39 ≈ 1.5 对相近
    expect(without.pairs).toBeGreaterThan(1.3);
    expect(withCoat.pairs).toBeLessThan(without.pairs * 0.25);
  });

  it('未收集 : 已收集的倾向基本不变', () => {
    // 每簇里一半未收集，避免把颜色与收集状态绑在一起
    const collected = new Set(clustered.filter((_, i) => i % 2 === 0).map((p) => p.petId));
    const { picks } = lookAlikePairs(clustered, collected);
    const avg = (ids: string[]) => ids.reduce((s, id) => s + (picks.get(id) ?? 0), 0) / ids.length;
    const ratio = avg(clustered.filter((p) => !collected.has(p.petId)).map((p) => p.petId)) / avg([...collected]);
    expect(ratio).toBeGreaterThan(1.6);
    expect(ratio).toBeLessThan(2.2);
  });

  it('候选全是同一毛色时照样凑满 6 只', () => {
    const same: CandidatePet[] = others.slice(0, 8).map((p) => ({ ...p, coat: [30, 0, 0, 0.8, 0] }));
    const rng = createRng(1);
    expect(sampleLineup(same, 'ME', new Set(), () => rng.next()).lineup).toHaveLength(6);
  });

  it('自家宠物不受毛色影响，其他位置避开与它相近的', () => {
    const mine: CandidatePet[] = own(1).map((p) => ({ ...p, coat: coatOfCluster(0, 0) }));
    const rng = createRng(99);
    const random = () => rng.next();
    let ownIn = 0;
    let cluster0 = 0;
    const trials = 20_000;
    for (let t = 0; t < trials; t++) {
      const { lineup, own: o } = sampleLineup([...mine, ...clustered], 'ME', new Set(), random);
      if (o.length) {
        ownIn++;
        cluster0 += lineup.filter((id) => id.startsWith('o') && clusterOf(id) === 0).length;
      }
    }
    expect(ownIn / trials).toBeCloseTo(LINEUP_WEIGHTS.ownSingle, 1);
    // 不降权时 5 个补位里平均有 5 × 5/40 ≈ 0.6 只同簇
    expect(cluster0 / ownIn).toBeLessThan(0.2);
  });
});
