import { describe, expect, it } from 'vitest';
import { createGame, findHint, previewRange, trySwap, type GameState, type Timeline } from '../../engine';
import { parseBoard } from '../../engine/board';
import { createGameClock } from '../clock';
import { resolveDrag, resolveTap } from '../input';
import { frameAt, type PlaybackBase } from '../playback';
import { rushView } from '../rush';
import { hintDue, nextTutorial, pickTip } from '../tips';

const LINEUP = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const DEAD = ['ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA'];
const CASCADE_210 = ['EFEFDFD', 'DEDEFEF', 'FDFCEDE', 'EFEBDFD', 'DEDFAEF', 'EDFACDE', 'DEBABCC'];
const p = (r: number, c: number) => ({ r, c });

function withCells(base: string[], cells: Record<string, string>) {
  const rows = base.map((r) => [...r]);
  for (const [k, ch] of Object.entries(cells)) {
    const [r, c] = k.split(',').map(Number);
    rows[r][c] = ch;
  }
  return rows.map((r) => r.join(''));
}

const baseOf = (s: GameState): PlaybackBase => ({ board: s.board, score: s.score, rushProgress: s.rush.progress });

describe('游戏时钟', () => {
  it('切后台或打开设置不暂停：回来时按实际经过时间更新', () => {
    let wall = 1000;
    const clock = createGameClock(() => wall);
    clock.start();
    wall += 20_000; // 期间页面在后台或设置打开，墙钟照走
    expect(clock.elapsed()).toBe(20_000);
  });

  it('系统洗牌暂停期间游戏时钟不走，恢复后继续', () => {
    let wall = 0;
    const clock = createGameClock(() => wall);
    clock.start();
    wall = 5_000;
    clock.pause();
    wall = 5_700;
    expect(clock.elapsed()).toBe(5_000);
    clock.resume();
    wall = 6_700;
    expect(clock.elapsed()).toBe(6_000);
  });

  it('洗牌从连锁结束的游戏时刻起暂停，渲染帧晚到也不多计时', () => {
    let wall = 0;
    const clock = createGameClock(() => wall, 1);
    clock.start();
    wall = 2_300; // 连锁在 2 000 结束，但下一帧 2 300 才发现
    const pausedWall = clock.pauseAt(2_000);
    expect(pausedWall).toBe(2_000);
    expect(clock.elapsed()).toBe(2_000);
    wall = pausedWall + 700;
    clock.resume();
    wall += 1_000;
    expect(clock.elapsed()).toBe(3_000);
  });

  it('洗牌暂停只扣除演示时长，晚发现的时间照常计时', () => {
    let wall = 0;
    const clock = createGameClock(() => wall);
    clock.start();
    const pausedWall = clock.pauseAt(1_000);
    wall = 10_000; // 页面在后台，9 秒后才回来
    clock.resume(pausedWall + 700);
    expect(clock.elapsed()).toBe(10_000 - 700);
  });

  it('开始前读数为 0（准备与读说明不计时）', () => {
    expect(createGameClock(() => 123_456).elapsed()).toBe(0);
  });
});

describe('时间线播放', () => {
  const s0 = createGame({ seed: 1, lineup: LINEUP, board: CASCADE_210, refill: [0, 1, 0, 0, 2, 0, 1, 2, 0] });
  const result = trySwap(s0, p(4, 4), p(4, 3), 1000);
  if (!result.ok) throw new Error('rejected');
  const timeline = result.timeline as Extract<Timeline, { kind: 'chain' }>;
  const base = baseOf(s0);

  it('交换段显示交换后的棋盘，分数未变', () => {
    const f = frameAt(base, timeline, 1050);
    expect(f.phase).toBe('swap');
    expect(f.board).toBe(timeline.boardAfterSwap);
    expect(f.score).toBe(0);
    expect(f.busy).toBe(true);
  });

  it('清除段标出被清除的棋子，结算时刻后才计入分数与飘字', () => {
    const clearing = frameAt(base, timeline, 1200);
    expect(clearing.phase).toBe('clear');
    expect(clearing.clearing.size).toBe(3);
    expect(clearing.score).toBe(0);
    const fall = frameAt(base, timeline, 1300);
    expect(fall.phase).toBe('fall');
    expect(fall.score).toBe(30);
    expect(fall.popups).toEqual([expect.objectContaining({ score: 30, chain: 1, startAt: 1300 })]);
    // 补落的 3 个新棋子从上方 3 格落下
    expect([...fall.dropRows.values()]).toEqual([3, 3, 3]);
  });

  it('每批一条飘字，连锁批序随批次递增', () => {
    const f = frameAt(base, timeline, 1940);
    expect(f.popups.map((x) => [x.score, x.chain])).toEqual([
      [30, 1],
      [60, 2],
      [120, 3],
    ]);
    expect(f.spawnedIds.size).toBe(1);
  });

  it('忙碌结束后回到空闲，分数与引擎一致', () => {
    const f = frameAt(base, timeline, timeline.busyUntil);
    expect(f.phase).toBe('idle');
    expect(f.busy).toBe(false);
    expect(f.score).toBe(result.state.score);
    expect(f.board).toBe(timeline.batches[2].boardAfter);
  });

  it('无效交换先换过去再回弹', () => {
    const bounce = trySwap(s0, p(0, 0), p(0, 1), 5000);
    if (!bounce.ok) throw new Error('rejected');
    expect(frameAt(base, bounce.timeline, 5050).board[0][0]?.id).toBe(s0.board[0][1]?.id);
    expect(frameAt(base, bounce.timeline, 5150).board[0][0]?.id).toBe(s0.board[0][0]?.id);
    expect(frameAt(base, bounce.timeline, 5240).busy).toBe(false);
  });

  it('剪＋剪合体在清除段带出合体范围', () => {
    const s = createGame({ seed: 1, lineup: LINEUP, board: withCells(DEAD, { '3,2': 'x', '3,3': 'x' }) });
    const r = trySwap(s, p(3, 2), p(3, 3), 0);
    if (!r.ok) throw new Error('rejected');
    const f = frameAt(baseOf(s), r.timeline, 200);
    expect(f.sweeps[0]).toEqual({ kind: 'combo', tools: ['scissors', 'scissors'], center: p(3, 3) });
    expect(f.clearing.size).toBe(49);
  });
});

describe('拖拽与点选', () => {
  it('位移不足为 none，方向明确后先瞄准，达到触发距离才交换', () => {
    expect(resolveDrag(p(3, 3), 5, 2, 50, 7)).toEqual({ stage: 'none', target: null });
    expect(resolveDrag(p(3, 3), 12, 3, 50, 7)).toEqual({ stage: 'aim', target: p(3, 4) });
    expect(resolveDrag(p(3, 3), 3, -30, 50, 7)).toEqual({ stage: 'trigger', target: p(2, 3) });
  });

  it('斜拖按位移更大的轴判定；棋盘外没有目标', () => {
    expect(resolveDrag(p(3, 3), -20, 18, 50, 7).target).toEqual(p(3, 2));
    expect(resolveDrag(p(0, 0), 0, -40, 50, 7)).toEqual({ stage: 'none', target: null });
  });

  it('点选：同格取消，相邻交换（落点为第二次点击），非相邻改选', () => {
    expect(resolveTap(null, p(1, 1))).toEqual({ kind: 'select', selected: p(1, 1) });
    expect(resolveTap(p(1, 1), p(1, 1))).toEqual({ kind: 'deselect' });
    expect(resolveTap(p(1, 1), p(1, 2))).toEqual({ kind: 'swap', from: p(1, 1), to: p(1, 2) });
    expect(resolveTap(p(1, 1), p(3, 3))).toEqual({ kind: 'select', selected: p(3, 3) });
  });
});

describe('范围预览', () => {
  const s = createGame({ seed: 1, lineup: LINEUP, board: withCells(DEAD, { '3,2': 'h', '3,3': 'x', '0,0': 'v' }) });

  it('单工具按交换后的位置计算', () => {
    // 竖梳 (0,0) 拖向 (0,1)：落到第 1 列
    expect(previewRange(s, p(0, 0), p(0, 1))?.every((x) => x.c === 1)).toBe(true);
    // 普通棋子 (1,0) 拖向竖梳 (0,0)：竖梳换到 (1,0)，仍清第 0 列
    expect(previewRange(s, p(1, 0), p(0, 0))?.every((x) => x.c === 0)).toBe(true);
  });

  it('两工具按合体与落点计算', () => {
    // 去重后正好 33 格，交叉格不重复绘制
    expect(previewRange(s, p(3, 2), p(3, 3))).toHaveLength(33);
  });

  it('不涉及工具时没有预览', () => {
    expect(previewRange(s, p(6, 0), p(6, 1))).toBeNull();
  });
});

describe('提示与带教', () => {
  it('稳定约 5 秒无有效操作才提示', () => {
    expect(hintDue(14_999, 10_000)).toBe(false);
    expect(hintDue(15_000, 10_000)).toBe(true);
  });

  it('提示给出的操作真实有效（多种子）', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = createGame({ seed, lineup: LINEUP });
      const hint = findHint(s)!;
      const r = trySwap(s, hint.from, hint.to, 0);
      expect(r.ok && r.timeline.kind).toBe('chain');
    }
  });

  it('首次出现工具提示对应用法，相邻工具优先提示合体，看过不再提示', () => {
    const one = parseBoard(withCells(DEAD, { '0,0': 'h' })).board;
    const pair = parseBoard(withCells(DEAD, { '0,0': 'h', '0,1': 'x' })).board;
    expect(nextTutorial(one, new Set())).toBe('comb');
    expect(nextTutorial(parseBoard(withCells(DEAD, { '2,2': 'x' })).board, new Set())).toBe('scissors');
    expect(nextTutorial(pair, new Set())).toBe('combo');
    expect(nextTutorial(pair, new Set(['combo']))).toBe('comb');
    expect(nextTutorial(pair, new Set(['combo', 'tool']))).toBeNull();
  });

  it('提示区同一时刻至多一条，带教与卡关提示不叠加', () => {
    const none = { finishing: false, shuffling: false, tutorial: null, hint: false, lastSeconds: false };
    expect(pickTip({ ...none, tutorial: 'comb', hint: true })).toBe('tutorial.comb');
    expect(pickTip({ ...none, finishing: true, hint: true })).toBe('round.finishing');
    expect(pickTip({ ...none, hint: true, lastSeconds: true })).toBe('board.move_hint');
    expect(pickTip(none)).toBeNull();
  });
});

describe('催单条状态', () => {
  it('30 秒前不显示，30 秒出现并分别显示进度与催单剩余秒数', () => {
    expect(rushView(null, 0, 29_999)).toEqual({ state: 'hidden' });
    expect(rushView(null, 0, 30_000)).toEqual({ state: 'active', served: 0, secondsLeft: 20 });
    expect(rushView(null, 7, 42_000)).toEqual({ state: 'active', served: 7, secondsLeft: 8 });
    expect(rushView(null, 11, 49_999)).toEqual({ state: 'active', served: 11, secondsLeft: 1 });
  });

  it('达标批次结算后显示成功，1.5 秒后收起', () => {
    expect(rushView(41_000, 12, 40_999)).toMatchObject({ state: 'active' });
    expect(rushView(41_000, 12, 41_000)).toEqual({ state: 'success' });
    expect(rushView(41_000, 12, 42_500)).toEqual({ state: 'hidden' });
  });

  it('50 秒未达标显示未赶上，随后收起，不扣分', () => {
    expect(rushView(null, 9, 50_000)).toEqual({ state: 'expired' });
    expect(rushView(null, 9, 51_500)).toEqual({ state: 'hidden' });
  });
});
