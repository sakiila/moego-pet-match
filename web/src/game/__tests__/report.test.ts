import { describe, expect, it } from 'vitest';
import type { GameSummary } from '../../engine';
import { judgeMvp, judgeReview, judgeTitle } from '../report';

const base: GameSummary = {
  score: 300,
  clearedCells: 30,
  clearedByMultiplier: [30, 0, 0, 0, 0],
  maxChain: 2,
  toolsFired: 0,
  combos: { cc: 0, cs: 0, dryer: 0 },
  validMoves: 5,
  actedInLastSeconds: false,
  rushSucceeded: false,
  pets: [0, 1, 2, 3, 4, 5].map((order) => ({ id: `p${order}`, order, served: 0, firstServedSeq: null })),
};
const withPets = (served: [number, number, number | null][]): GameSummary => ({
  ...base,
  pets: base.pets.map((p, i) => (served[i] ? { ...p, served: served[i][0], firstServedSeq: served[i][2] } : p)),
});

describe('MVP', () => {
  it('服务次数最多者', () => {
    expect(judgeMvp(withPets([[3, 0, 1], [9, 0, 2], [4, 0, 1]]))).toBe(1);
  });
  it('平手比首次服务批次', () => {
    expect(judgeMvp(withPets([[5, 0, 3], [5, 0, 2]]))).toBe(1);
  });
  it('同批首次服务再按登记顺序', () => {
    expect(judgeMvp(withPets([[5, 0, 2], [5, 0, 2]]))).toBe(0);
  });
  it('零服务省略 MVP', () => {
    expect(judgeMvp(base)).toBeNull();
  });
});

describe('主称号优先级', () => {
  it.each([
    [{ combos: { cc: 0, cs: 0, dryer: 1 }, maxChain: 6, rushSucceeded: true }, 'title.cleanup_chief'],
    [{ maxChain: 5, rushSucceeded: true, toolsFired: 4 }, 'title.chain_lead'],
    [{ rushSucceeded: true, toolsFired: 4, actedInLastSeconds: true }, 'title.scheduling_pro'],
    [{ toolsFired: 3, actedInLastSeconds: true }, 'title.tool_pro'],
    [{ toolsFired: 2, actedInLastSeconds: true }, 'title.last_second'],
    [{}, 'title.pet_officer'],
  ] as const)('%o → %s', (over, title) => {
    expect(judgeTitle({ ...base, ...over })).toBe(title);
  });
  it('梳＋剪合体计 2 个工具，再加 1 个即达到洗护工具大师', () => {
    expect(judgeTitle({ ...base, toolsFired: 3, combos: { cc: 0, cs: 1, dryer: 0 } })).toBe('title.tool_pro');
  });
});

describe('角色评语优先级', () => {
  it.each([
    [{ clearedCells: 0, maxChain: 0, rushSucceeded: false }, 'no_service'],
    [{ maxChain: 5, rushSucceeded: true, combos: { cc: 1, cs: 0, dryer: 0 } }, 'high_chain'],
    [{ rushSucceeded: true, combos: { cc: 1, cs: 0, dryer: 0 } }, 'rush_success'],
    [{ combos: { cc: 0, cs: 1, dryer: 0 } }, 'tool_combo'],
    [{}, 'normal'],
  ] as const)('%o → %s', (over, which) => {
    expect(judgeReview({ ...base, ...over }, 'normal')).toBe(`review.pet.${which}`);
    expect(judgeReview({ ...base, ...over }, 'fish')).toBe(`review.fish.${which}`);
  });
});
