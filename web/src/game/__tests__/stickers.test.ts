import { describe, expect, it } from 'vitest';
import type { Batch, Timeline } from '../../engine';
import { chainStickers } from '../stickers';

const lineup = ['a', 'b', 'c', 'd', 'e', 'f'];
const chain = (...served: number[][]): Timeline => ({
  kind: 'chain',
  acceptedAt: 0,
  from: { r: 0, c: 0 },
  to: { r: 0, c: 1 },
  boardAfterSwap: [],
  batches: served.map((s) => ({ servedByKind: s }) as unknown as Batch),
  busyUntil: 0,
  shuffled: null,
});

describe('局内贴纸', () => {
  it('新宠按独立宠物去重合并，已暂记的不重复', () => {
    const t = chain([3, 0, 0, 0, 0, 0], [2, 3, 0, 0, 0, 0], [0, 0, 4, 0, 0, 0]);
    expect(chainStickers(t, lineup, new Set(['a', 'b', 'c']), {}, new Set(), new Set()).newPets).toEqual(['a', 'b', 'c']);
    expect(chainStickers(t, lineup, new Set(['a', 'b', 'c']), {}, new Set(['b']), new Set()).newPets).toEqual(['a', 'c']);
    expect(chainStickers(t, lineup, new Set(), {}, new Set(), new Set()).newPets).toEqual([]);
  });

  it('同家两只都被服务时团聚；三只取服务格数最多的两只；每家每局一次', () => {
    const families = { a: 'F1', b: 'F1', c: 'F1', d: 'F2' };
    const t = chain([3, 0, 0, 0, 0, 0], [0, 5, 4, 3, 0, 0]);
    expect(chainStickers(t, lineup, new Set(), families, new Set(), new Set()).reunion).toEqual({ familyId: 'F1', pets: ['b', 'c'] });
    expect(chainStickers(t, lineup, new Set(), families, new Set(), new Set(['F1'])).reunion).toBeNull();
  });

  it('同家只服务一只不团聚；无效交换没有贴纸', () => {
    expect(chainStickers(chain([3, 0, 0, 0, 0, 0]), lineup, new Set(), { a: 'F1', b: 'F1' }, new Set(), new Set()).reunion).toBeNull();
    const bounce: Timeline = { kind: 'bounce', acceptedAt: 0, from: { r: 0, c: 0 }, to: { r: 0, c: 1 }, busyUntil: 1 };
    expect(chainStickers(bounce, lineup, new Set(['a']), {}, new Set(), new Set())).toEqual({ newPets: [], reunion: null });
  });
});
