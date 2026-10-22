import { describe, expect, it } from 'vitest';
import { createGame, trySwap, type Timeline } from '../engine';
import { isPlayable } from '../engine/moves';
import { PRESETS } from './presets';

const LINEUP = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const game = (name: string) => createGame({ seed: 1, lineup: LINEUP, ...PRESETS[name] });
const chain = (t: Timeline) => (t.kind === 'chain' ? t : null)!;

describe('开发验收预设', () => {
  it('cascade：拖 (4,4)→(4,3) 得 210 分', () => {
    const r = trySwap(game('cascade'), { r: 4, c: 4 }, { r: 4, c: 3 }, 0);
    expect(r.ok && r.state.score).toBe(210);
  });

  it('shuffle：一步之后成死局，系统洗牌且洗牌不产生收益', () => {
    const r = trySwap(game('shuffle'), { r: 1, c: 2 }, { r: 0, c: 2 }, 0);
    if (!r.ok) throw new Error('rejected');
    const t = chain(r.timeline);
    expect(t.batches).toHaveLength(1);
    expect(t.shuffled).not.toBeNull();
    expect(isPlayable(t.shuffled!)).toBe(true);
    expect(r.state.score).toBe(30);
    expect(r.state.board).toBe(t.shuffled);
  });
});
