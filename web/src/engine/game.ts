import { inBounds, isAdjacent, parseBoard } from './board';
import { DIRECTOR, RULES, type DirectorConfig } from './config';
import { generateBoard, validMoves } from './moves';
import { comboRange, isMerge, toolRange } from './tools';
import { resolveMove } from './resolve';
import { createRng, shuffleInPlace } from './rng';
import type { GameEvent, GameState, Move, Pos, SwapRejection, Timeline } from './types';

export interface CreateGameOptions {
  seed: number;
  /** 本局 6 种宠物（或鱼色）标识；登记时随机打乱并固定，kind 即其下标。 */
  lineup: string[];
  /** 固定棋盘夹具（测试用）。 */
  board?: string[];
  /** 优先使用的补落 kind 序列（测试用），用完后交给补落导演。 */
  refill?: number[];
  /** 补落导演参数；默认 DIRECTOR，传 null 关闭（测试与调参用）。 */
  director?: DirectorConfig | null;
}

export function createGame({ seed, lineup, board, refill = [], director = DIRECTOR }: CreateGameOptions): GameState {
  if (lineup.length !== RULES.kinds) throw new Error(`Lineup must have ${RULES.kinds} entries`);
  const rng = createRng(seed);
  const registered = shuffleInPlace([...lineup], rng);
  const initial = board ? parseBoard(board) : generateBoard(RULES.size, RULES.kinds, rng, 1);
  return {
    board: initial.board,
    lineup: registered,
    rngState: rng.state,
    refillQueue: [...refill],
    director,
    drought: 0,
    nextId: initial.nextId,
    phase: 'playing',
    busyUntil: 0,
    batchSeq: 0,
    score: 0,
    clearedCells: 0,
    clearedByMultiplier: Array(RULES.maxMultiplier).fill(0),
    maxChain: 0,
    toolsFired: 0,
    combos: { cc: 0, cs: 0, dryer: 0 },
    served: lineup.map(() => 0),
    firstServedSeq: lineup.map(() => null),
    validMoves: 0,
    lastValidMoveAt: null,
    rush: { progress: 0, succeeded: false, bonusAt: null },
    emitted: { rushStart: false, rushEnd: false, timeUp: false },
  };
}

function cloneState(s: GameState): GameState {
  return {
    ...s,
    refillQueue: [...s.refillQueue],
    clearedByMultiplier: [...s.clearedByMultiplier],
    served: [...s.served],
    firstServedSeq: [...s.firstServedSeq],
    rush: { ...s.rush },
    combos: { ...s.combos },
    emitted: { ...s.emitted },
  };
}

export type SwapResult = { ok: false; reason: SwapRejection } | { ok: true; state: GameState; timeline: Timeline };

/**
 * 尝试交换 from → to（to 为拖动落点或第二次点选的格子）。
 * 只在棋盘稳定且游戏时钟 t < 90 s 时受理；无效的普通交换也受理并回弹。
 */
export function trySwap(state: GameState, from: Pos, to: Pos, t: number): SwapResult {
  if (state.phase !== 'playing') return { ok: false, reason: 'ended' };
  if (t >= RULES.durationMs) return { ok: false, reason: 'timeUp' };
  if (t < state.busyUntil) return { ok: false, reason: 'busy' };
  const size = state.board.length;
  if (!inBounds(from, size) || !inBounds(to, size) || !isAdjacent(from, to)) return { ok: false, reason: 'notAdjacent' };

  const s = cloneState(state);
  const rng = createRng(s.rngState);
  const timeline = resolveMove(s, { from, to }, t, rng);
  s.rngState = rng.state;
  return { ok: true, state: s, timeline };
}

/** 推进游戏时钟，产出催单开始／结束、到时与收尾完成事件。到时不发动棋盘上的闲置道具。 */
export function advance(state: GameState, t: number): { state: GameState; events: GameEvent[] } {
  if (state.phase !== 'playing') return { state, events: [] };
  const s = cloneState(state);
  const events: GameEvent[] = [];
  if (!s.emitted.rushStart && t >= RULES.rush.startMs) {
    s.emitted.rushStart = true;
    events.push({ type: 'rushStart', at: RULES.rush.startMs });
  }
  if (!s.emitted.rushEnd && t >= RULES.rush.endMs) {
    s.emitted.rushEnd = true;
    events.push({ type: 'rushEnd', at: RULES.rush.endMs, succeeded: s.rush.succeeded });
  }
  if (!s.emitted.timeUp && t >= RULES.durationMs) {
    s.emitted.timeUp = true;
    events.push({ type: 'timeUp', at: RULES.durationMs });
  }
  if (t >= RULES.durationMs && t >= s.busyUntil) {
    s.phase = 'ended';
    events.push({ type: 'finished', at: Math.max(RULES.durationMs, s.busyUntil) });
  }
  return { state: s, events };
}

/** 确认退出只在 t < 90 s 时生效并作废本局；到时后照常收尾结算。 */
export function confirmExit(state: GameState, t: number): { state: GameState; discarded: boolean } {
  if (state.phase !== 'playing' || t >= RULES.durationMs) return { state, discarded: false };
  return { state: { ...state, phase: 'discarded' }, discarded: true };
}

/**
 * 工具直接范围预览：手势已指向相邻目标但未触发交换时调用。
 * 单工具按交换后的位置计算，两工具按合体与落点计算；不涉及工具时返回 null。
 * 只描述直接范围，不预测扫到其他道具后的扩展与后续连消。
 */
export function previewRange(state: GameState, from: Pos, to: Pos): Pos[] | null {
  const size = state.board.length;
  if (!inBounds(from, size) || !inBounds(to, size) || !isAdjacent(from, to)) return null;
  const a = state.board[from.r][from.c];
  const b = state.board[to.r][to.c];
  let cells: Pos[] | null = null;
  if (a?.type === 'tool' && b?.type === 'tool') {
    // 两个剪刀只合成吹风机，没有清除范围；预览标出将合并的两格
    cells = isMerge(a.tool, b.tool) ? [from, to] : comboRange(a.tool, b.tool, to, size);
  } else if (a?.type === 'tool') cells = toolRange(a.tool, to, size);
  else if (b?.type === 'tool') cells = toolRange(b.tool, from, size);
  if (!cells) return null;
  const unique = new Map(cells.map((p) => [p.r * size + p.c, p]));
  return [...unique.entries()].sort((x, y) => x[0] - y[0]).map(([, p]) => p);
}

/** 卡关提示：返回一步当前确实有效的操作；没有时返回 null（应已由洗牌处理）。 */
export function findHint(state: GameState): Move | null {
  return validMoves(state.board)[0] ?? null;
}

export interface GameSummary {
  score: number;
  clearedCells: number;
  clearedByMultiplier: number[];
  maxChain: number;
  toolsFired: number;
  combos: { cc: number; cs: number; dryer: number };
  validMoves: number;
  actedInLastSeconds: boolean;
  rushSucceeded: boolean;
  /** 按登记顺序排列，MVP 平手时依次比较 served、firstServedSeq、order。 */
  pets: { id: string; order: number; served: number; firstServedSeq: number | null }[];
}

export function getSummary(state: GameState): GameSummary {
  return {
    score: state.score,
    clearedCells: state.clearedCells,
    clearedByMultiplier: [...state.clearedByMultiplier],
    maxChain: state.maxChain,
    toolsFired: state.toolsFired,
    combos: { ...state.combos },
    validMoves: state.validMoves,
    actedInLastSeconds:
      state.lastValidMoveAt !== null && state.lastValidMoveAt >= RULES.durationMs - RULES.lastSecondsMs,
    rushSucceeded: state.rush.succeeded,
    pets: state.lineup.map((id, order) => ({
      id,
      order,
      served: state.served[order],
      firstServedSeq: state.firstServedSeq[order],
    })),
  };
}
