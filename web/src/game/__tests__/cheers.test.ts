import { describe, expect, it } from 'vitest';
import { parseBoard } from '../../engine/board';
import { createGame, findHint, trySwap, type Batch, type Timeline } from '../../engine';
import { advanceCheer, CHEER_DURATION_MS, pickCheer, type CheerState } from '../cheers';

const board = parseBoard(['ABCDEFA', 'BCDEFAB', 'CDEFABC', 'DEFABCD', 'EFABCDE', 'FABCDEF', 'ABCDEFA']).board;
const cells = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }];
const cleared = (count: number) => board.flatMap((row, r) => row.map((_, c) => ({ r, c }))).slice(0, count);
const batch = (index: number, over: Partial<Batch> = {}): Batch => ({
  index, seq: index, multiplier: Math.min(5, index), startAt: 0, settleAt: 100,
  effect: 'match', groups: [cells], combo: null, merge: null, toolsFired: [], cleared: cells,
  spawned: [], score: 300, rushProgress: null, servedByKind: [3, 0, 0, 0, 0, 0],
  rushBonus: false, boardAfter: board, ...over,
});
const chain = (...batches: Batch[]): Timeline => ({
  kind: 'chain', acceptedAt: 0, from: { r: 0, c: 0 }, to: { r: 0, c: 1 },
  boardAfterSwap: board, batches, busyUntil: 1000, shuffled: null,
});
const empty = (): CheerState => ({ handledSeq: 0, active: null });

describe('每次操作的唯一最高档喝彩', () => {
  it('只有一次消除时保持安静', () => {
    expect(pickCheer(chain(batch(1)))).toBeNull();
  });
  it('二连消 Nice、三连消 Great、四连消及以上 Amazing', () => {
    expect(pickCheer(chain(batch(1), batch(2)))).toBe('nice');
    expect(pickCheer(chain(batch(3)))).toBe('great');
    expect(pickCheer(chain(batch(4)))).toBe('amazing');
    expect(pickCheer(chain(batch(5)))).toBe('amazing');
    expect(pickCheer(chain(batch(8)))).toBe('amazing');
  });
  it('实际双道具合体即使在第一轮，也给 Great，不冒充五连消', () => {
    for (const effect of ['comboCC', 'comboCS'] as const) expect(pickCheer(chain(batch(1, { effect })))).toBe('great');
  });
  it('吹风机和实际清全盘优先给 Wow，不被连消或 18 格条件覆盖', () => {
    expect(pickCheer(chain(batch(1, { effect: 'dryer' })))).toBe('wow');
    const all = board.flatMap((row, r) => row.map((_, c) => ({ r, c })));
    expect(pickCheer(chain(batch(1, { cleared: all })))).toBe('wow');
    expect(pickCheer(chain(batch(1, { effect: 'dryer' }), batch(5)))).toBe('wow');
  });
  it('单次累计清除达到 18 格时给 Amazing，17 格不升级', () => {
    expect(pickCheer(chain(batch(1, { cleared: cleared(18) })))).toBe('amazing');
    expect(pickCheer(chain(batch(1, { cleared: cleared(17), effect: 'comboCS' })))).toBe('great');
    expect(pickCheer(chain(batch(1, { cleared: cleared(18), effect: 'comboCS' })))).toBe('amazing');
  });
  it('跨批次累计 18 格，重复落点的新棋子仍按实际清除计入', () => {
    expect(pickCheer(chain(batch(1, { cleared: cleared(9) }), batch(2, { cleared: cleared(9) })))).toBe('amazing');
    expect(pickCheer(chain(batch(1, { cleared: cleared(8) }), batch(2, { cleared: cleared(9) })))).toBe('nice');
  });
  it('合成吹风机的零分批不喝彩，也不按批次数冒充连消', () => {
    const merge = batch(0, { seq: 1, effect: 'merge', score: 0, cleared: [], merge: { from: { r: 0, c: 0 }, to: { r: 0, c: 1 } } });
    expect(pickCheer(chain(merge))).toBeNull();
    expect(pickCheer(chain(merge, batch(1, { seq: 2 })))).toBeNull();
    expect(pickCheer(chain(merge, batch(1, { seq: 2 }), batch(2, { seq: 3 })))).toBe('nice');
  });
  it('真实引擎的二连消会在补落完成后发出一次 Nice', () => {
    const lineup = ['a', 'b', 'c', 'd', 'e', 'f'];
    const game = createGame({ seed: 4, lineup });
    const move = findHint(game)!;
    const result = trySwap(game, move.from, move.to, 0);
    if (!result.ok || result.timeline.kind !== 'chain') throw new Error('Expected a real cascade');
    const found = result.timeline;
    expect(Math.max(...found.batches.map((b) => b.index))).toBe(2);
    expect(advanceCheer(empty(), found, found.busyUntil - 1).active).toBeNull();
    const complete = advanceCheer(empty(), found, found.busyUntil);
    expect(complete.active?.kind).toBe('nice');
    expect(advanceCheer(complete, found, found.busyUntil + 16)).toEqual(complete);
  });
});

describe('喝彩完成边界与生命周期', () => {
  const timeline = chain(batch(1), batch(2));

  it('补落全部完成后才发出，重复帧不会再发一次', () => {
    expect(advanceCheer(empty(), timeline, 999)).toEqual(empty());
    const first = advanceCheer(empty(), timeline, 1000);
    expect(first).toEqual({ handledSeq: 2, active: { key: 2, kind: 'nice', at: 1000 } });
    expect(advanceCheer(first, timeline, 1016)).toEqual(first);
  });
  it('800ms 后收起；旧时间线仍在也不重播', () => {
    const first = advanceCheer(empty(), timeline, 1000);
    const done = advanceCheer(first, timeline, 1000 + CHEER_DURATION_MS);
    expect(done).toEqual({ handledSeq: 2, active: null });
    expect(advanceCheer(done, timeline, 2000)).toEqual(done);
  });
  it('下一次操作给出新事件，不受上一句停留时间影响', () => {
    const first = advanceCheer(empty(), timeline, 1000);
    const next = { ...chain(batch(3, { seq: 7 })), busyUntil: 1500 };
    expect(advanceCheer(first, next, 1500)).toEqual({ handledSeq: 7, active: { key: 7, kind: 'great', at: 1500 } });
  });
  it('弹层或后台抑制时清掉并消费当前操作，恢复时不补播', () => {
    const suppressed = advanceCheer(empty(), timeline, 700, false);
    expect(suppressed).toEqual({ handledSeq: 2, active: null });
    expect(advanceCheer(suppressed, timeline, 1000)).toEqual(suppressed);
    const first = advanceCheer(empty(), timeline, 1000);
    expect(advanceCheer(first, timeline, 1100, false).active).toBeNull();
  });
  it('过期或到时后的操作不喝彩，前一条也立即清理', () => {
    expect(advanceCheer(empty(), timeline, 1900)).toEqual({ handledSeq: 2, active: null });
    const final = { ...timeline, busyUntil: 90_000 };
    expect(advanceCheer(empty(), final, 90_000)).toEqual({ handledSeq: 2, active: null });
    const first = advanceCheer(empty(), timeline, 1000);
    expect(advanceCheer(first, null, 90_000).active).toBeNull();
  });
  it('无效交换不产生事件', () => {
    const bounce: Timeline = { kind: 'bounce', acceptedAt: 0, from: { r: 0, c: 0 }, to: { r: 0, c: 1 }, busyUntil: 240 };
    expect(advanceCheer(empty(), bounce, 1000)).toEqual(empty());
  });
});
