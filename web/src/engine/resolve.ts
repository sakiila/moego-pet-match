import { cloneBoard, keyPos, posKey } from './board';
import { RULES, TIMING } from './config';
import { findGroups, spawnPosition, toolForGroup, type Group } from './match';
import { isDead, shuffleBoard } from './moves';
import type { Rng } from './rng';
import { comboEffect, comboRange, strongerEffect, toolEffect, toolRange } from './tools';
import type { Batch, Board, Effect, GameState, Move, Piece, Pos, Timeline, ToolType } from './types';

interface Seed {
  cells: Pos[];
  fired: { pos: Pos; tool: ToolType }[];
  combo: Batch['combo'];
  effect: Effect;
  consumed: Pos[];
}

/** 一次操作内首批 ×1，之后每批 +1，最高 ×5。 */
export const chainMultiplier = (index: number) => Math.min(index, RULES.maxMultiplier);

/** 道具交换在第一批直接发动：两道具为合体，单道具在交换后的位置发动。 */
function toolSeed(a: Piece | null, b: Piece | null, move: Move, size: number): Seed | null {
  if (a?.type === 'tool' && b?.type === 'tool') {
    const center = move.to;
    return {
      cells: comboRange(a.tool, b.tool, center, size),
      fired: [],
      combo: { tools: [a.tool, b.tool], center },
      effect: comboEffect(a.tool, b.tool),
      consumed: [move.from, move.to],
    };
  }
  const tool = a?.type === 'tool' ? a : b?.type === 'tool' ? b : null;
  if (!tool) return null;
  const pos = tool === a ? move.to : move.from;
  return {
    cells: toolRange(tool.tool, pos, size),
    fired: [{ pos, tool: tool.tool }],
    combo: null,
    effect: toolEffect(tool.tool),
    consumed: [pos],
  };
}

function applyGravity(board: Board, s: GameState, rng: Rng) {
  const size = board.length;
  for (let c = 0; c < size; c++) {
    const stack: Piece[] = [];
    for (let r = size - 1; r >= 0; r--) {
      const p = board[r][c];
      if (p) stack.push(p);
    }
    for (let r = size - 1; r >= 0; r--) board[r][c] = stack[size - 1 - r] ?? null;
    for (let r = 0; r < size && board[r][c] === null; r++) {
      const kind = s.refillQueue.length > 0 ? s.refillQueue.shift()! : rng.int(s.lineup.length);
      board[r][c] = { id: s.nextId++, type: 'pet', kind };
    }
  }
}

/**
 * 结算一次已受理的交换，直接修改传入的（已复制的）状态，返回时间线。
 * 整条连锁在受理时一次算完；每批按 TIMING 推算结算时刻，催单据此判定。
 */
export function resolveMove(s: GameState, move: Move, t: number, rng: Rng): Timeline {
  const size = s.board.length;
  const board = cloneBoard(s.board);
  const a = board[move.from.r][move.from.c];
  const b = board[move.to.r][move.to.c];
  board[move.from.r][move.from.c] = b;
  board[move.to.r][move.to.c] = a;

  let seed = toolSeed(a, b, move, size);
  let groups: Group[] = findGroups(board);
  if (!seed && groups.length === 0) {
    s.busyUntil = t + TIMING.bounceMs;
    return { kind: 'bounce', acceptedAt: t, from: move.from, to: move.to, busyUntil: s.busyUntil };
  }

  const boardAfterSwap = cloneBoard(board);
  const batches: Batch[] = [];
  let clock = t + TIMING.swapMs;

  for (let index = 1; seed || groups.length > 0; index++) {
    const cover = new Map<number, Pos>();
    const add = (p: Pos) => cover.set(posKey(p, size), p);
    groups.forEach((g) => g.cells.forEach(add));
    seed?.cells.forEach(add);

    // 同批扫到的道具继续发动，覆盖格合并去重
    const consumed = new Set((seed?.consumed ?? []).map((p) => posKey(p, size)));
    const toolsFired = [...(seed?.fired ?? [])];
    let effect: Effect = seed?.effect ?? 'match';
    const pending = [...cover.keys()];
    while (pending.length > 0) {
      const k = pending.pop()!;
      const piece = board[Math.floor(k / size)][k % size];
      if (piece?.type !== 'tool' || consumed.has(k)) continue;
      consumed.add(k);
      const pos = keyPos(k, size);
      toolsFired.push({ pos, tool: piece.tool });
      effect = strongerEffect(effect, toolEffect(piece.tool));
      for (const cell of toolRange(piece.tool, pos, size)) {
        const ck = posKey(cell, size);
        if (!cover.has(ck)) {
          cover.set(ck, cell);
          pending.push(ck);
        }
      }
    }

    const cleared = [...cover.entries()].sort((x, y) => x[0] - y[0]).map(([, p]) => p);
    const multiplier = chainMultiplier(index);
    const score = cleared.length * RULES.baseScore * multiplier;
    const seq = ++s.batchSeq;
    const startAt = clock;
    const settleAt = startAt + TIMING.clearMs[effect];
    clock = settleAt + TIMING.fallMs;

    for (const p of cleared) {
      const piece = board[p.r][p.c];
      if (piece?.type !== 'pet') continue;
      s.served[piece.kind]++;
      s.firstServedSeq[piece.kind] ??= seq;
    }

    // 催单只计结算时刻 30 s ≤ t < 50 s 的批次；达标加一次固定奖励，不乘倍率
    const inRush = settleAt >= RULES.rush.startMs && settleAt < RULES.rush.endMs;
    let rushBonus = false;
    if (inRush && !s.rush.succeeded) {
      s.rush.progress += cleared.length;
      if (s.rush.progress >= RULES.rush.target) {
        s.rush.succeeded = true;
        s.rush.bonusAt = settleAt;
        rushBonus = true;
      }
    }

    const spawned: Batch['spawned'] = [];
    for (const g of groups) {
      const tool = toolForGroup(g);
      if (tool) spawned.push({ pos: spawnPosition(g, index === 1 ? move : undefined), piece: { id: s.nextId++, type: 'tool', tool } });
    }

    for (const p of cleared) board[p.r][p.c] = null;
    for (const sp of spawned) board[sp.pos.r][sp.pos.c] = sp.piece;
    applyGravity(board, s, rng);

    s.score += score + (rushBonus ? RULES.rush.bonus : 0);
    s.clearedCells += cleared.length;
    s.toolsFired += toolsFired.length + (seed?.combo ? 2 : 0);

    batches.push({
      index,
      seq,
      multiplier,
      startAt,
      settleAt,
      effect,
      groups: groups.map((g) => g.cells),
      combo: seed?.combo ?? null,
      toolsFired,
      cleared,
      spawned,
      score,
      rushProgress: inRush ? s.rush.progress : null,
      rushBonus,
      boardAfter: cloneBoard(board),
    });

    seed = null;
    groups = findGroups(board);
  }

  s.busyUntil = clock;
  s.maxChain = Math.max(s.maxChain, batches.length);
  s.validMoves++;
  s.lastValidMoveAt = t;

  let shuffled: Board | null = null;
  if (s.busyUntil < RULES.durationMs && isDead(board)) {
    const result = shuffleBoard(board, rng, s.nextId, s.lineup.length);
    s.nextId = result.nextId;
    shuffled = result.board;
  }
  s.board = shuffled ?? board;

  return {
    kind: 'chain',
    acceptedAt: t,
    from: move.from,
    to: move.to,
    boardAfterSwap,
    batches,
    busyUntil: s.busyUntil,
    shuffled,
  };
}
