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
