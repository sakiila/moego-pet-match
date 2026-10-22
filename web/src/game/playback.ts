import { RULES, TIMING, type Board, type Batch, type Pos, type Timeline, type ToolType } from '../engine';

/** 时间线开始前的显示状态。 */
export interface PlaybackBase {
  board: Board;
  score: number;
  rushProgress: number;
}

export type Sweep =
  | { kind: 'tool'; tool: ToolType; at: Pos }
  | { kind: 'combo'; tools: [ToolType, ToolType]; center: Pos };

export interface Popup {
  key: number;
  score: number;
  /** 本次操作内的批序，≥ 2 时显示连锁。 */
  chain: number;
  at: { r: number; c: number };
  startAt: number;
}

export interface Frame {
  board: Board;
  phase: 'idle' | 'swap' | 'bounce' | 'clear' | 'fall';
  /** 本阶段棋子位移的过渡时长。 */
  moveMs: number;
  clearing: Set<number>;
  clearMs: number;
  sweeps: Sweep[];
  spawnedIds: Set<number>;
  /** 补落的新棋子 → 从棋盘上方几格落下。 */
  dropRows: Map<number, number>;
  score: number;
  rushProgress: number;
  rushSucceededAt: number | null;
  popups: Popup[];
  busy: boolean;
}

const idsAt = (board: Board, cells: Pos[]) =>
  new Set(cells.map((p) => board[p.r][p.c]?.id).filter((id): id is number => id !== undefined));

function swapped(board: Board, from: Pos, to: Pos): Board {
  const next = board.map((row) => row.slice());
  next[from.r][from.c] = board[to.r][to.c];
  next[to.r][to.c] = board[from.r][from.c];
  return next;
}

function centroid(cells: Pos[]) {
  return {
    r: cells.reduce((s, p) => s + p.r, 0) / cells.length,
    c: cells.reduce((s, p) => s + p.c, 0) / cells.length,
  };
}

function landing(before: Board, batch: Batch) {
  const beforeIds = new Set(before.flat().map((p) => p?.id));
  const spawnedIds = new Set(batch.spawned.map((s) => s.piece.id));
  const dropRows = new Map<number, number>();
  const size = batch.boardAfter.length;
  for (let c = 0; c < size; c++) {
    const fresh: number[] = [];
    for (let r = 0; r < size; r++) {
      const id = batch.boardAfter[r][c]?.id;
      if (id !== undefined && !beforeIds.has(id) && !spawnedIds.has(id)) fresh.push(id);
    }
    for (const id of fresh) dropRows.set(id, fresh.length);
  }
  return { spawnedIds, dropRows };
}

function sweepsOf(batch: Batch): Sweep[] {
  const sweeps: Sweep[] = batch.toolsFired.map((f) => ({ kind: 'tool', tool: f.tool, at: f.pos }));
  if (batch.combo) sweeps.unshift({ kind: 'combo', tools: batch.combo.tools, center: batch.combo.center });
  return sweeps;
}

const EMPTY = new Set<number>();

/**
 * 按游戏时钟 g 计算当前应显示的画面。纯函数：同一时间线 + 同一 g → 同一画面。
 * 分数与催单进度只计入 settleAt ≤ g 的批次，因此与动画同步，而最终值与引擎一致。
 */
export function frameAt(base: PlaybackBase, timeline: Timeline | null, g: number): Frame {
  const idle = (board: Board): Frame => ({
    board,
    phase: 'idle',
    moveMs: TIMING.fallMs,
    clearing: EMPTY,
    clearMs: 0,
    sweeps: [],
    spawnedIds: EMPTY,
    dropRows: new Map(),
    score: base.score,
    rushProgress: base.rushProgress,
    rushSucceededAt: null,
    popups: [],
    busy: false,
  });

  if (!timeline) return idle(base.board);

  if (timeline.kind === 'bounce') {
    if (g >= timeline.busyUntil) return idle(base.board);
    const out = g < timeline.acceptedAt + TIMING.bounceMs / 2;
    return {
      ...idle(out ? swapped(base.board, timeline.from, timeline.to) : base.board),
      phase: 'bounce',
      moveMs: TIMING.bounceMs / 2,
      busy: true,
    };
  }

  const { batches } = timeline;
  let score = base.score;
  let rushProgress = base.rushProgress;
  let rushSucceededAt: number | null = null;
  const popups: Popup[] = [];
  for (const b of batches) {
    if (b.settleAt > g) break;
    score += b.score + (b.rushBonus ? RULES.rush.bonus : 0);
    if (b.rushProgress !== null) rushProgress = b.rushProgress;
    if (b.rushBonus) rushSucceededAt = b.settleAt;
    popups.push({ key: b.seq, score: b.score, chain: b.index, at: centroid(b.cleared), startAt: b.settleAt });
  }
  const totals = { score, rushProgress, rushSucceededAt, popups };

  if (g >= timeline.busyUntil) {
    const last = batches[batches.length - 1];
    const before = batches.length > 1 ? batches[batches.length - 2].boardAfter : timeline.boardAfterSwap;
    return {
      ...idle(timeline.shuffled ?? last.boardAfter),
      ...totals,
      ...(timeline.shuffled ? { moveMs: 600 } : landing(before, last)),
    };
  }

  if (g < batches[0].startAt) {
    return { ...idle(timeline.boardAfterSwap), ...totals, phase: 'swap', moveMs: TIMING.swapMs, busy: true };
  }

  let i = batches.length - 1;
  while (i > 0 && batches[i].startAt > g) i--;
  const batch = batches[i];
  const before = i === 0 ? timeline.boardAfterSwap : batches[i - 1].boardAfter;

  if (g < batch.settleAt) {
    const prev = i === 0 ? null : landing(i === 1 ? timeline.boardAfterSwap : batches[i - 2].boardAfter, batches[i - 1]);
    return {
      ...idle(before),
      ...totals,
      ...(prev ?? {}),
      phase: 'clear',
      clearing: idsAt(before, batch.cleared),
      clearMs: batch.settleAt - batch.startAt,
      sweeps: sweepsOf(batch),
      busy: true,
    };
  }

  return { ...idle(batch.boardAfter), ...totals, ...landing(before, batch), phase: 'fall', busy: true };
}
