import { describe, expect, it } from 'vitest';
import { formatBoard } from '../board';
import { RULES } from '../config';
import { advance, confirmExit, createGame, findHint, getSummary, previewRange, trySwap } from '../game';
import { findLines } from '../match';
import { isDead, isPlayable, shuffleBoard, validMoves } from '../moves';
import { chainMultiplier } from '../resolve';
import { createRng } from '../rng';
import type { GameState, Timeline } from '../types';
import { DEAD, LINEUP, game, p, withCells } from './fixtures';

type Chain = Extract<Timeline, { kind: 'chain' }>;

function swap(state: GameState, from: ReturnType<typeof p>, to: ReturnType<typeof p>, t: number) {
  const result = trySwap(state, from, to, t);
  if (!result.ok) throw new Error(`swap rejected: ${result.reason}`);
  return result;
}

function chain(timeline: Timeline): Chain {
  if (timeline.kind !== 'chain') throw new Error('expected chain');
  return timeline;
}

/**
 * 交换 (4,4)→(4,3) 后：A 竖三消 → 补落成 B 横三消 → 再补落成 C 横四消并留下横梳。
 * 补落序列固定，保证之后不再有消除。
 */
const CASCADE_210 = ['EFEFDFD', 'DEDEFEF', 'FDFCEDE', 'EFEBDFD', 'DEDFAEF', 'EDFACDE', 'DEBABCC'];
const CASCADE_REFILL = [0, 1, 0, 0, 2, 0, 1, 2, 0];

/** (5,3)→(6,3) 凑出底行直五；四个补落格不再形成匹配。 */
const STRAIGHT_FIVE = ['ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA', 'CDEFABC', 'EFAACDE', 'BAACAAD'];
const STRAIGHT_FIVE_REFILL = [1, 2, 3, 4];
/** (2,2)→(2,3) 先消竖三，再补成顶行直五。 */
const REFILL_FIVE = ['BAACAAD', 'CDECABC', 'EFCBCDE', 'ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA'];
const REFILL_FIVE_QUEUE = [0, 3, 5, 1, 2, 3, 4];

describe('开局与洗牌', () => {
  it('随机开局没有现成匹配，且至少一步有效交换', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(isPlayable(createGame({ seed, lineup: LINEUP }).board)).toBe(true);
    }
  });

  it('同一种子得到相同棋盘与阵容登记顺序，登记顺序是阵容的重排', () => {
    const a = createGame({ seed: 42, lineup: LINEUP });
    const b = createGame({ seed: 42, lineup: LINEUP });
    expect(formatBoard(a.board)).toEqual(formatBoard(b.board));
    expect(a.lineup).toEqual(b.lineup);
    expect([...a.lineup].sort()).toEqual(LINEUP);
  });

  it('死局洗牌后与开局同标准，保留原有棋子', () => {
    const dead = game(DEAD).board;
    expect(isDead(dead)).toBe(true);
    const { board } = shuffleBoard(dead, createRng(3), 100, 6);
    expect(isPlayable(board)).toBe(true);
    const ids = (b: typeof board) => b.flat().map((x) => x!.id).sort((m, n) => m - n);
    expect(ids(board)).toEqual(ids(dead));
  });

  it('棋盘上还有道具时不判死局', () => {
    expect(isDead(game(withCells(DEAD, { '3,3': 'h' })).board)).toBe(false);
  });
});

describe('交换受理', () => {
  const s = game(CASCADE_210, CASCADE_REFILL);

  it('非相邻交换不受理', () => {
    expect(trySwap(s, p(0, 0), p(0, 2), 0)).toEqual({ ok: false, reason: 'notAdjacent' });
  });

  it('无效的普通交换回弹，不加分，棋盘不变', () => {
    const { state, timeline } = swap(s, p(0, 0), p(0, 1), 1000);
    expect(timeline).toMatchObject({ kind: 'bounce', busyUntil: 1240 });
    expect(state.score).toBe(0);
    expect(state.validMoves).toBe(0);
    expect(formatBoard(state.board)).toEqual(CASCADE_210);
  });

  it('棋盘忙碌时不受理，也不排队', () => {
    const { state } = swap(s, p(4, 4), p(4, 3), 1000);
    expect(trySwap(state, p(0, 0), p(0, 1), state.busyUntil - 1)).toEqual({ ok: false, reason: 'busy' });
    expect(trySwap(state, p(0, 0), p(0, 1), state.busyUntil).ok).toBe(true);
  });

  it('t < 90 s 受理，t = 90 s 不受理', () => {
    expect(trySwap(s, p(4, 4), p(4, 3), 90_000)).toEqual({ ok: false, reason: 'timeUp' });
    expect(trySwap(s, p(4, 4), p(4, 3), 89_999).ok).toBe(true);
  });
});

describe('计分、连锁与道具生成', () => {
  it('手动直五在清除后生成吹风机，五格仍计 500 分且不自动发动', () => {
    const { state, timeline } = swap(game(STRAIGHT_FIVE, STRAIGHT_FIVE_REFILL), p(5, 3), p(6, 3), 1000);
    const { batches, boardAfterSwap } = chain(timeline);
    expect(batches).toHaveLength(1);
    const first = batches[0];
    expect(first.cleared).toHaveLength(5);
    expect(first.score).toBe(500);
    expect(first.effect).toBe('match');
    expect(boardAfterSwap[6][3]).toMatchObject({ type: 'pet', kind: 0 });
    expect(first.spawned).toEqual([{ pos: p(6, 3), piece: expect.objectContaining({ type: 'tool', tool: 'dryer' }) }]);
    expect(first.boardAfter[6][3]).toMatchObject({ type: 'tool', tool: 'dryer' });
    expect(first.toolsFired).toEqual([]);
    expect(state).toMatchObject({ score: 500, clearedCells: 5, clearedByMultiplier: [5, 0, 0, 0, 0], toolsFired: 0, combos: { cc: 0, cs: 0, dryer: 0 } });
    expect(state.refillQueue).toEqual([]);
  });

  it('补落直五自动生成吹风机，下一次相邻交换才清除全盘', () => {
    // 全盘清除后按列补回可操作的固定棋盘，整个验证不依赖随机补落。
    const afterDryer = Array.from({ length: 7 }, (_, c) => STRAIGHT_FIVE.map((row) => row.charCodeAt(c) - 65)).flat();
    const { state, timeline } = swap(game(REFILL_FIVE, [...REFILL_FIVE_QUEUE, ...afterDryer]), p(2, 2), p(2, 3), 1000);
    const { batches } = chain(timeline);
    expect(batches).toHaveLength(2);
    expect(batches.map((batch) => batch.cleared.length)).toEqual([3, 5]);
    expect(formatBoard(batches[0].boardAfter)[0]).toBe('BAAAAAD');
    expect(batches[0].spawned).toEqual([]);
    expect(batches[1].spawned).toEqual([{ pos: p(0, 3), piece: expect.objectContaining({ type: 'tool', tool: 'dryer' }) }]);
    expect(state.board[0][3]).toMatchObject({ type: 'tool', tool: 'dryer' });
    expect(state).toMatchObject({ score: 1300, toolsFired: 0, combos: { dryer: 0 } });

    const activated = swap(state, p(0, 3), p(0, 4), state.busyUntil);
    const cleared = chain(activated.timeline).batches;
    expect(cleared).toHaveLength(1);
    expect(cleared[0]).toMatchObject({ effect: 'dryer', score: 4900, toolsFired: [{ pos: p(0, 4), tool: 'dryer' }] });
    expect(cleared[0].cleared).toHaveLength(49);
    expect(activated.state).toMatchObject({ score: 6200, clearedCells: 57, toolsFired: 1, combos: { dryer: 1 } });
    expect(formatBoard(activated.state.board)).toEqual(STRAIGHT_FIVE);
    expect(activated.state.refillQueue).toEqual([]);
  });

  it('三消 → 三消 → 四消 = 300 + 600 + 1200 = 2100，并留下梳子', () => {
    const { state, timeline } = swap(game(CASCADE_210, CASCADE_REFILL), p(4, 4), p(4, 3), 1000);
    const { batches } = chain(timeline);
    expect(batches.map((b) => b.cleared.length)).toEqual([3, 3, 4]);
    expect(batches.map((b) => b.multiplier)).toEqual([1, 2, 3]);
    expect(batches.map((b) => b.score)).toEqual([300, 600, 1200]);
    expect(state.score).toBe(2100);
    expect(batches[2].spawned).toMatchObject([{ pos: p(6, 5), piece: { type: 'tool', tool: 'combH' } }]);
    // 新道具在批次结束后生成，不因生成本身发动
    expect(formatBoard(state.board)).toEqual([
      'EFABCFA',
      'DEECAED',
      'FDDADDF',
      'EFFBFFE',
      'DEEAEED',
      'EDDFDDF',
      'DEFEFhE',
    ]);
  });

  it('按时长初值推算每批结算时刻与忙碌区间', () => {
    const { timeline } = swap(game(CASCADE_210, CASCADE_REFILL), p(4, 4), p(4, 3), 1000);
    const { batches, busyUntil } = chain(timeline);
    expect(batches.map((b) => [b.startAt, b.settleAt])).toEqual([
      [1120, 1300],
      [1440, 1620],
      [1760, 1940],
    ]);
    expect(busyUntil).toBe(2080);
  });

  it('连锁倍率依次 ×1…×5，之后封顶 ×5', () => {
    expect([1, 2, 3, 4, 5, 6, 9].map(chainMultiplier)).toEqual([1, 2, 3, 4, 5, 5, 5]);
  });

  it('下一次操作的倍率从 ×1 重新开始', () => {
    const first = swap(game(CASCADE_210, CASCADE_REFILL), p(4, 4), p(4, 3), 1000);
    const hint = findHint(first.state)!;
    const second = swap(first.state, hint.from, hint.to, first.state.busyUntil);
    expect(chain(second.timeline).batches[0].multiplier).toBe(1);
  });

  it('服务次数按宠物统计，并记录首次服务批次', () => {
    const { state } = swap(game(CASCADE_210, CASCADE_REFILL), p(4, 4), p(4, 3), 1000);
    const summary = getSummary(state);
    expect(state.served.slice(0, 3)).toEqual([3, 3, 4]);
    expect(state.firstServedSeq.slice(0, 3)).toEqual([1, 2, 3]);
    expect(summary).toMatchObject({ score: 2100, clearedCells: 10, maxChain: 3, toolsFired: 0, validMoves: 1 });
    // 3 格 ×1、3 格 ×2、4 格 ×3：100×(3 + 6 + 12) = 2100
    expect(summary.clearedByMultiplier).toEqual([3, 3, 4, 0, 0]);
  });
});

describe('道具发动与合体', () => {
  const twoTools = (a: string, b: string) => game(withCells(DEAD, { '3,2': a, '3,3': b }));

  it.each([
    ['梳＋梳', 'h', 'v', 13, 'comboCC'],
    ['梳＋剪', 'h', 'x', 33, 'comboCS'],
  ])('%s（%s ⇄ %s）以落点为中心首批覆盖 %i 格', (_, a, b, cells, effect) => {
    const { state, timeline } = swap(twoTools(a, b), p(3, 2), p(3, 3), 1000);
    const first = chain(timeline).batches[0];
    expect(first.cleared).toHaveLength(cells);
    expect(first.effect).toBe(effect);
    expect(first.combo?.center).toEqual(p(3, 3));
    expect(first.score).toBe(cells * RULES.baseScore);
    expect(state.toolsFired).toBeGreaterThanOrEqual(2);
  });

  it('剪＋剪不清除：合成一个吹风机在落点，不计分、不计催单、不计清除格数', () => {
    const { state, timeline } = swap(twoTools('x', 'x'), p(3, 2), p(3, 3), 1000);
    const { batches } = chain(timeline);
    const first = batches[0];
    expect(first.effect).toBe('merge');
    expect(first.merge).toEqual({ from: p(3, 2), to: p(3, 3) });
    expect(first.index).toBe(0);
    expect(first.score).toBe(0);
    expect(first.cleared).toEqual([p(3, 2), p(3, 3)]);
    expect(first.spawned).toEqual([{ pos: p(3, 3), piece: expect.objectContaining({ type: 'tool', tool: 'dryer' }) }]);
    expect(first.boardAfter[3][3]).toMatchObject({ type: 'tool', tool: 'dryer' });
    // 合成后只有这一枚吹风机，另一枚剪刀已消失
    expect(formatBoard(first.boardAfter).join('').match(/d/g)).toHaveLength(1);
    expect(formatBoard(first.boardAfter).join('')).not.toContain('x');
    expect(state.score).toBe(batches.reduce((sum, b) => sum + b.score, 0));
    expect(state.toolsFired).toBe(0);
    expect(state.combos).toEqual({ cc: 0, cs: 0, dryer: 0 });
    expect(state.rush.progress).toBe(0);
    expect(state.validMoves).toBe(1);
  });

  it('合成后的连锁倍率从 ×1 开始，合成批不抬高倍率', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = createGame({ seed, lineup: LINEUP, board: withCells(DEAD, { '3,2': 'x', '3,3': 'x' }) });
      const { timeline } = swap(s, p(3, 2), p(3, 3), 1000);
      const scoring = chain(timeline).batches.filter((b) => !b.merge);
      scoring.forEach((b, i) => expect(b.index).toBe(i + 1));
      expect(chain(timeline).batches[0].multiplier).toBe(1);
    }
  });

  it('吹风机与任意相邻宠物交换即发动：清全盘 49 格并计分', () => {
    const s = game(withCells(DEAD, { '3,3': 'd' }));
    const { state, timeline } = swap(s, p(3, 3), p(3, 4), 1000);
    const first = chain(timeline).batches[0];
    expect(first.effect).toBe('dryer');
    expect(first.cleared).toHaveLength(49);
    expect(first.score).toBe(4900);
    expect(first.multiplier).toBe(1);
    expect(first.toolsFired).toEqual([{ pos: p(3, 4), tool: 'dryer' }]);
    expect(state.toolsFired).toBeGreaterThanOrEqual(1);
    expect(state.combos.dryer).toBe(1);
    expect(state.clearedCells).toBeGreaterThanOrEqual(49);
  });

  it('吹风机与梳子 / 剪刀 / 另一吹风机交换：只发动吹风机，被扫到的道具各自计一次', () => {
    const withComb = chain(swap(game(withCells(DEAD, { '3,3': 'd', '3,4': 'h' })), p(3, 3), p(3, 4), 1000).timeline).batches[0];
    expect(withComb.effect).toBe('dryer');
    expect(withComb.combo).toBeNull();
    expect(withComb.cleared).toHaveLength(49);
    expect(withComb.toolsFired.map((f) => f.tool).sort()).toEqual(['combH', 'dryer']);
    const withScissors = chain(swap(game(withCells(DEAD, { '3,3': 'd', '3,4': 'x' })), p(3, 3), p(3, 4), 1000).timeline).batches[0];
    expect(withScissors.combo).toBeNull();
    expect(withScissors.toolsFired.map((f) => f.tool).sort()).toEqual(['dryer', 'scissors']);
    const two = game(withCells(DEAD, { '3,3': 'd', '3,4': 'd' }));
    const { state, timeline } = swap(two, p(3, 3), p(3, 4), 1000);
    expect(chain(timeline).batches[0].cleared).toHaveLength(49);
    expect(state.combos.dryer).toBeGreaterThanOrEqual(1);
  });

  it('吹风机被别的道具扫到时连锁引爆，清全盘', () => {
    const s = game(withCells(DEAD, { '3,1': 'h', '3,5': 'd' }));
    const { timeline } = swap(s, p(3, 1), p(3, 0), 1000);
    const first = chain(timeline).batches[0];
    expect(first.cleared).toHaveLength(49);
    expect(first.toolsFired.map((f) => f.tool).sort()).toEqual(['combH', 'dryer']);
    expect(first.effect).toBe('dryer');
  });

  it('吹风机与普通棋子的预览为整盘，两剪刀的预览为将合并的两格', () => {
    const dry = game(withCells(DEAD, { '3,3': 'd' }));
    expect(previewRange(dry, p(3, 3), p(3, 4))).toHaveLength(49);
    const two = game(withCells(DEAD, { '3,2': 'x', '3,3': 'x' }));
    expect(previewRange(two, p(3, 2), p(3, 3))).toEqual([p(3, 2), p(3, 3)]);
  });

  it('扫到其他道具时继续发动，同批覆盖去重', () => {
    const s = game(withCells(DEAD, { '3,1': 'h', '3,5': 'v' }));
    const { timeline } = swap(s, p(3, 1), p(3, 0), 1000);
    const first = chain(timeline).batches[0];
    // 第 3 行 7 格 + 第 5 列 7 格 − 交叉 1 格
    expect(first.cleared).toHaveLength(13);
    expect(first.toolsFired.map((f) => f.tool).sort()).toEqual(['combH', 'combV']);
    expect(first.multiplier).toBe(1);
  });

  it('道具⇄普通棋子：道具范围与被换过去的棋子形成的匹配同属第一批 ×1', () => {
    const s = game(withCells(DEAD, { '5,4': 'A', '6,3': 'A', '6,4': 'v' }));
    const { timeline } = swap(s, p(6, 3), p(6, 4), 1000);
    const first = chain(timeline).batches[0];
    // 竖梳落到 (6,3) 清第 3 列 7 格 + A 在第 4 列凑成的 3 格
    expect(first.cleared).toHaveLength(10);
    expect(first.score).toBe(1000);
    expect(first.toolsFired).toEqual([{ pos: p(6, 3), tool: 'combV' }]);
  });

  it('道具与任意相邻棋子交换即可发动，不需要形成匹配', () => {
    const s = game(withCells(DEAD, { '3,3': 'x' }));
    const first = chain(swap(s, p(3, 3), p(3, 4), 1000).timeline).batches[0];
    expect(first.toolsFired).toEqual([{ pos: p(3, 4), tool: 'scissors' }]);
    expect(first.cleared).toHaveLength(13);
  });
});

describe('催单与时间端点', () => {
  const ss = () => game(withCells(DEAD, { '3,2': 'd' }));

  it('结算时刻 49 999 ms 计入催单，达标加一次 100 分', () => {
    // 交换 120 + 吹风机清除 360 = 480 ms
    const { state, timeline } = swap(ss(), p(3, 2), p(3, 3), 49_519);
    const { batches } = chain(timeline);
    expect(batches[0].settleAt).toBe(49_999);
    expect(batches[0].rushProgress).toBe(49);
    expect(batches[0].rushBonus).toBe(true);
    expect(batches.filter((b) => b.rushBonus)).toHaveLength(1);
    const clearScore = batches.reduce((sum, b) => sum + b.score, 0);
    expect(state.score).toBe(clearScore + RULES.rush.bonus);
  });

  it('结算时刻 50 000 ms 不计入催单', () => {
    const { state, timeline } = swap(ss(), p(3, 2), p(3, 3), 49_520);
    const { batches } = chain(timeline);
    expect(batches[0].settleAt).toBe(50_000);
    expect(batches[0].rushProgress).toBeNull();
    expect(state.rush).toMatchObject({ progress: 0, succeeded: false });
  });

  it('催单开始前的批次不计入', () => {
    const { timeline } = swap(ss(), p(3, 2), p(3, 3), 29_000);
    expect(chain(timeline).batches[0].rushProgress).toBeNull();
  });

  it('90 s 前受理的操作，连锁越过 90 s 仍完整计分', () => {
    const { state, timeline } = swap(ss(), p(3, 2), p(3, 3), 89_999);
    const { batches } = chain(timeline);
    expect(batches[0].settleAt).toBeGreaterThan(RULES.durationMs);
    expect(state.score).toBe(batches.reduce((sum, b) => sum + b.score, 0));
  });

  it('到时停止受理，收完连锁后结束；闲置道具不自动发动', () => {
    const s = game(withCells(DEAD, { '0,0': 'x' }));
    const ended = advance(s, 90_000);
    expect(ended.events.map((e) => e.type)).toEqual(['rushStart', 'rushEnd', 'timeUp', 'finished']);
    expect(ended.state.phase).toBe('ended');
    expect(formatBoard(ended.state.board)[0][0]).toBe('x');
    expect(ended.state.score).toBe(0);
  });

  it('连锁未收完时到时，等收尾结束才 finished', () => {
    const { state } = swap(ss(), p(3, 2), p(3, 3), 89_900);
    expect(advance(state, 90_000).events.map((e) => e.type)).not.toContain('finished');
    const done = advance(advance(state, 90_000).state, state.busyUntil);
    expect(done.events).toEqual([{ type: 'finished', at: state.busyUntil }]);
  });
});

describe('退出', () => {
  const s = game(CASCADE_210, CASCADE_REFILL);

  it('t < 90 s 确认退出作废本局', () => {
    const result = confirmExit(s, 89_999);
    expect(result.discarded).toBe(true);
    expect(result.state.phase).toBe('discarded');
    expect(trySwap(result.state, p(4, 4), p(4, 3), 89_999)).toEqual({ ok: false, reason: 'ended' });
  });

  it('到时后确认退出无效，照常结算', () => {
    expect(confirmExit(s, 90_000)).toEqual({ state: s, discarded: false });
  });
});

describe('确定性与不变量', () => {
  function play(seed: number) {
    let state = createGame({ seed, lineup: LINEUP });
    const timelines: Timeline[] = [];
    for (let i = 0; i < 40; i++) {
      const hint = findHint(state);
      if (!hint) break;
      const result = swap(state, hint.from, hint.to, state.busyUntil + 500);
      if (result.state.busyUntil >= RULES.durationMs) break;
      state = result.state;
      timelines.push(result.timeline);
      // 每次稳定后：没有现成匹配，也不是死局
      expect(findLines(state.board)).toHaveLength(0);
      expect(validMoves(state.board).length).toBeGreaterThan(0);
    }
    return { state, timelines };
  }

  it('同种子 + 同操作序列得到完全相同的时间线', () => {
    expect(JSON.stringify(play(7))).toBe(JSON.stringify(play(7)));
  });

  it('多种子随机对局中，稳定棋盘始终可操作', () => {
    for (let seed = 1; seed <= 20; seed++) play(seed);
  });

  it('最后 3 秒内有有效操作会被记录', () => {
    const { state } = swap(game(CASCADE_210, CASCADE_REFILL), p(4, 4), p(4, 3), 87_000);
    expect(getSummary(state).actedInLastSeconds).toBe(true);
  });
});
