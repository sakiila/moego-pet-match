import { describe, expect, it } from 'vitest';
import { formatBoard, parseBoard } from '../board';
import { DIRECTOR, RULES, type DirectorConfig } from '../config';
import { luckOf, pickWeighted, refillWeights, stageFactor } from '../director';
import { createGame, findHint, getSummary, trySwap } from '../game';
import { findLines } from '../match';
import { validMoves } from '../moves';
import { createRng } from '../rng';
import type { GameState, Timeline } from '../types';
import { DEAD, LINEUP, p, withCells } from './fixtures';

type Chain = Extract<Timeline, { kind: 'chain' }>;

/** 不含运气与阶段：只看基础加权，便于断言具体数值。 */
const FLAT: DirectorConfig = {
  ...DIRECTOR,
  boost3: { base: 2, luck: 0 },
  boost2: { base: 0.5, luck: 0 },
  phases: [{ fromMs: 0, factor: 1 }],
};

const board = (rows: string[]) => parseBoard(rows).board;

describe('补落权重：只看落点局部形态', () => {
  it('落点下方已有两个同类时，该类拿到三连加权，其余为 1', () => {
    const b = board(['...', 'A..', 'A..']);
    expect(refillWeights(b, p(0, 0), 3, 0, 1, FLAT)).toEqual([3, 1, 1]);
  });

  it('左右各一个同类合成横向三连，也拿三连加权', () => {
    const b = board(['B.B', 'CDE', 'FAC']);
    expect(refillWeights(b, p(0, 1), 6, 0, 1, FLAT)[1]).toBe(3);
  });

  it('只有一个相邻同类时拿「差一个」加权', () => {
    const b = board(['...', 'A..', 'B..']);
    expect(refillWeights(b, p(0, 0), 3, 0, 1, FLAT)).toEqual([1.5, 1, 1]);
  });

  it('同时满足三连与差一个只按三连计，不叠加', () => {
    // 下方两个 A 成竖三连，左边一个 A 又成差一个
    const b = board(['A..', 'AA.', 'AA.']);
    expect(refillWeights(b, p(0, 1), 3, 0, 1, FLAT)[0]).toBe(3);
  });

  it('尚未补落的空格不算邻居', () => {
    const b = board(['...', 'A..', 'A..']);
    // (0,1) 左边 (0,0) 为空，下方 (1,1)(2,1) 也为空：没有任何加权
    expect(refillWeights(b, p(0, 1), 3, 0, 1, FLAT)).toEqual([1, 1, 1]);
  });

  it('道具格不参与形态判断', () => {
    const b = board(['...', 'h..', 'A..']);
    expect(refillWeights(b, p(0, 0), 3, 0, 1, FLAT)).toEqual([1, 1, 1]);
  });

  it('权重只随形态变化，不随种类身份变化：交换种类编号得到交换后的权重', () => {
    const original = board(['...', 'B..', 'BA.']);
    const swapped = board(['...', 'A..', 'AB.']);
    const w1 = refillWeights(original, p(0, 0), 3, 0, 1, FLAT);
    const w2 = refillWeights(swapped, p(0, 0), 3, 0, 1, FLAT);
    expect(w2).toEqual([w1[1], w1[0], w1[2]]);
  });
});

describe('运气预算与阶段系数', () => {
  it('运气按久旱步数线性上升，到上限封顶', () => {
    const cfg = { ...DIRECTOR, droughtCap: 4 };
    expect(luckOf(0, cfg)).toBe(0);
    expect(luckOf(2, cfg)).toBe(0.5);
    expect(luckOf(4, cfg)).toBe(1);
    expect(luckOf(9, cfg)).toBe(1);
  });

  it('运气只放大加权部分，基础权重 1 不变', () => {
    const cfg: DirectorConfig = { ...FLAT, boost3: { base: 1, luck: 3 } };
    const b = board(['...', 'A..', 'A..']);
    expect(refillWeights(b, p(0, 0), 3, 0, 1, cfg)[0]).toBe(2);
    expect(refillWeights(b, p(0, 0), 3, 1, 1, cfg)[0]).toBe(5);
    expect(refillWeights(b, p(0, 0), 3, 1, 1, cfg)[1]).toBe(1);
  });

  it('阶段系数同样只乘加权部分', () => {
    const b = board(['...', 'A..', 'A..']);
    expect(refillWeights(b, p(0, 0), 3, 0, 2, FLAT)).toEqual([5, 1, 1]);
  });

  it('阶段按半开区间取最后一个 fromMs ≤ t 的系数', () => {
    const cfg: DirectorConfig = {
      ...DIRECTOR,
      phases: [
        { fromMs: 0, factor: 1 },
        { fromMs: 30_000, factor: 1.3 },
        { fromMs: 50_000, factor: 1 },
        { fromMs: 75_000, factor: 1.8 },
      ],
    };
    expect(stageFactor(0, cfg)).toBe(1);
    expect(stageFactor(29_999, cfg)).toBe(1);
    expect(stageFactor(30_000, cfg)).toBe(1.3);
    expect(stageFactor(49_999, cfg)).toBe(1.3);
    expect(stageFactor(50_000, cfg)).toBe(1);
    expect(stageFactor(75_000, cfg)).toBe(1.8);
    expect(stageFactor(120_000, cfg)).toBe(1.8);
  });
});

describe('加权抽样', () => {
  it('权重相等时退化为等概率，且由种子决定', () => {
    const a = pickWeighted([1, 1, 1, 1], createRng(5));
    const b = pickWeighted([1, 1, 1, 1], createRng(5));
    expect(a).toBe(b);
    const counts = [0, 0, 0, 0];
    const rng = createRng(9);
    for (let i = 0; i < 4000; i++) counts[pickWeighted([1, 1, 1, 1], rng)]++;
    for (const n of counts) expect(Math.abs(n / 4000 - 0.25)).toBeLessThan(0.03);
  });

  it('权重为 0 的项永远不会被抽到', () => {
    const rng = createRng(2);
    for (let i = 0; i < 500; i++) expect(pickWeighted([0, 1, 0, 3], rng)).not.toBe(0);
  });
});

describe('接入结算：补落受导演影响', () => {
  /**
   * 交换 (2,3)→(2,2) 让第 2 列 (0,2)(1,2)(2,2) 三个 A 竖消，列顶空出三格。
   * 第 2 列下方 (3,2)(4,2) 是两个 F：若最底一格 (2,2) 补落 F，立刻形成竖三连进入第二批。
   */
  const VERT = withCells(DEAD, { '0,2': 'A', '1,2': 'A', '2,2': 'B', '2,3': 'A', '3,2': 'F', '4,2': 'F' });
  const SWAP = [p(2, 3), p(2, 2)] as const;

  it('夹具本身没有现成匹配', () => {
    expect(findLines(parseBoard(VERT).board)).toHaveLength(0);
  });

  function chainOf(state: GameState, from: ReturnType<typeof p>, to: ReturnType<typeof p>): Chain {
    const r = trySwap(state, from, to, 1000);
    if (!r.ok || r.timeline.kind !== 'chain') throw new Error('expected chain');
    return r.timeline;
  }

  it('极大加权时，久旱玩家的补落必然接出连消', () => {
    const cfg: DirectorConfig = { ...FLAT, boost3: { base: 1e9, luck: 0 } };
    for (let seed = 1; seed <= 20; seed++) {
      const s = createGame({ seed, lineup: LINEUP, board: VERT, director: cfg });
      const chain = chainOf(s, ...SWAP);
      expect(chain.batches.length).toBeGreaterThanOrEqual(2);
      expect(chain.batches[0].boardAfter[2][2]).toMatchObject({ type: 'pet', kind: 5 });
    }
  });

  it('关闭导演时同一局面不保证连消，补落退回均匀随机', () => {
    let cascades = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const s = createGame({ seed, lineup: LINEUP, board: VERT, director: null });
      if (chainOf(s, ...SWAP).batches.length >= 2) cascades++;
    }
    expect(cascades).toBeLessThan(30);
  });

  it('固定补落序列优先于导演，用完后才由导演接管', () => {
    const cfg: DirectorConfig = { ...FLAT, boost3: { base: 1e9, luck: 0 } };
    // 先按队列从顶到底补 B、C、D：底格 (2,2) 是 D，不形成连消
    const s = createGame({ seed: 1, lineup: LINEUP, board: VERT, director: cfg, refill: [1, 2, 3] });
    const chain = chainOf(s, ...SWAP);
    expect(chain.batches).toHaveLength(1);
    expect(formatBoard(chain.batches[0].boardAfter)[0][2]).toBe('B');
    expect(formatBoard(chain.batches[0].boardAfter)[2][2]).toBe('D');
  });

  it('久旱计数：无连消的有效操作 +1，出现连消归零', () => {
    const cfg: DirectorConfig = { ...FLAT, boost3: { base: 1e9, luck: 0 } };
    const s0 = createGame({ seed: 1, lineup: LINEUP, board: VERT, director: cfg, refill: [1, 2, 3] });
    expect(s0.drought).toBe(0);
    const r1 = trySwap(s0, ...SWAP, 1000);
    if (!r1.ok) throw new Error('rejected');
    expect(r1.state.drought).toBe(1);
    const s2 = createGame({ seed: 1, lineup: LINEUP, board: VERT, director: cfg });
    const r2 = trySwap(s2, ...SWAP, 1000);
    if (!r2.ok) throw new Error('rejected');
    expect(r2.state.drought).toBe(0);
  });

  it('回弹不改变久旱计数', () => {
    const s = createGame({ seed: 1, lineup: LINEUP, board: DEAD });
    const r = trySwap(s, p(0, 0), p(0, 1), 1000);
    if (!r.ok) throw new Error('rejected');
    expect(r.timeline.kind).toBe('bounce');
    expect(r.state.drought).toBe(0);
  });

  it('同种子 + 同操作得到相同结果（导演是确定性的）', () => {
    const run = () => {
      let state = createGame({ seed: 11, lineup: LINEUP });
      const out: string[] = [];
      for (let i = 0; i < 30; i++) {
        const hint = findHint(state);
        if (!hint) break;
        const r = trySwap(state, hint.from, hint.to, state.busyUntil + 400);
        if (!r.ok) break;
        state = r.state;
        out.push(formatBoard(state.board).join('/'));
      }
      return out.join('\n');
    };
    expect(run()).toBe(run());
  });
});

describe('统计：导演提高连消率，同时保持各类掉落公平', () => {
  interface Stat {
    moves: number;
    cascades: number;
    tools: number;
    drops: number[];
  }

  /** 固定策略：每步取提示给出的第一步，让对局只由种子决定。 */
  function simulate(seed: number, director: DirectorConfig | null): Stat {
    let state = createGame({ seed, lineup: LINEUP, director });
    const stat: Stat = { moves: 0, cascades: 0, tools: 0, drops: Array(RULES.kinds).fill(0) };
    for (;;) {
      const t = state.busyUntil + 300;
      if (t >= RULES.durationMs) break;
      const moves = validMoves(state.board);
      const m = moves[seed % moves.length];
      const r = trySwap(state, m.from, m.to, t);
      if (!r.ok || r.timeline.kind !== 'chain') break;
      stat.moves++;
      if (r.timeline.batches.length >= 2) stat.cascades++;
      for (const b of r.timeline.batches) {
        for (const sp of b.spawned) if (sp.piece.type === 'tool') stat.tools++;
      }
      // 新补落的棋子：id 大于操作前最大 id 的宠物格
      const prevMax = state.nextId;
      for (const row of r.state.board) {
        for (const piece of row) if (piece && piece.type === 'pet' && piece.id >= prevMax) stat.drops[piece.kind]++;
      }
      state = r.state;
    }
    expect(getSummary(state).validMoves).toBe(stat.moves);
    return stat;
  }

  function aggregate(director: DirectorConfig | null) {
    const total: Stat = { moves: 0, cascades: 0, tools: 0, drops: Array(RULES.kinds).fill(0) };
    for (let seed = 1; seed <= 24; seed++) {
      const s = simulate(seed, director);
      total.moves += s.moves;
      total.cascades += s.cascades;
      total.tools += s.tools;
      s.drops.forEach((n, k) => (total.drops[k] += n));
    }
    return total;
  }

  it('开启导演后连消率明显高于均匀随机', () => {
    const on = aggregate(DIRECTOR);
    const off = aggregate(null);
    const rate = (s: Stat) => s.cascades / s.moves;
    expect(rate(on)).toBeGreaterThan(rate(off) * 1.3);
  });

  it('默认参数下各类掉落占比与 1/6 的偏差在 3 个百分点内', () => {
    const on = aggregate(DIRECTOR);
    const sum = on.drops.reduce((a, b) => a + b, 0);
    for (const n of on.drops) expect(Math.abs(n / sum - 1 / RULES.kinds)).toBeLessThan(0.03);
  });
});
