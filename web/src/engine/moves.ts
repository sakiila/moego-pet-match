import { cloneBoard, hasTool } from './board';
import { findLines } from './match';
import { shuffleInPlace, type Rng } from './rng';
import type { Board, Move, Piece } from './types';

function swapped(board: Board, m: Move): Board {
  const next = cloneBoard(board);
  next[m.from.r][m.from.c] = board[m.to.r][m.to.c];
  next[m.to.r][m.to.c] = board[m.from.r][m.from.c];
  return next;
}

/** 当前稳定棋盘上的全部有效操作：会形成消除的交换，或任何涉及道具的相邻交换。 */
export function validMoves(board: Board): Move[] {
  const size = board.length;
  const moves: Move[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const to of [{ r, c: c + 1 }, { r: r + 1, c }]) {
        if (to.r >= size || to.c >= size) continue;
        const m: Move = { from: { r, c }, to };
        const a = board[r][c];
        const b = board[to.r][to.c];
        if (a?.type === 'tool' || b?.type === 'tool' || findLines(swapped(board, m)).length > 0) moves.push(m);
      }
    }
  }
  return moves;
}

/** 既无普通有效交换、也无可发动道具时为死局。 */
export function isDead(board: Board): boolean {
  return !hasTool(board) && validMoves(board).length === 0;
}

/** 开局与洗牌共用的标准：没有现成匹配，且至少有一步有效交换。 */
export function isPlayable(board: Board): boolean {
  return findLines(board).length === 0 && validMoves(board).length > 0;
}

const kindOf = (p: Piece | null) => (p?.type === 'pet' ? p.kind : -1);

export function generateBoard(size: number, kinds: number, rng: Rng, nextId: number): { board: Board; nextId: number } {
  for (;;) {
    let id = nextId;
    const board: Board = [];
    for (let r = 0; r < size; r++) {
      const row: (Piece | null)[] = [];
      board.push(row);
      for (let c = 0; c < size; c++) {
        const banned = new Set<number>();
        if (c >= 2 && kindOf(row[c - 1]) === kindOf(row[c - 2])) banned.add(kindOf(row[c - 1]));
        if (r >= 2 && kindOf(board[r - 1][c]) === kindOf(board[r - 2][c])) banned.add(kindOf(board[r - 1][c]));
        const allowed = Array.from({ length: kinds }, (_, k) => k).filter((k) => !banned.has(k));
        row.push({ id: id++, type: 'pet', kind: allowed[rng.int(allowed.length)] });
      }
    }
    if (isPlayable(board)) return { board, nextId: id };
  }
}

/** 死局洗牌：保留原有棋子（同一阵容）重新排列，直到满足开局标准；多次失败则重新生成。 */
export function shuffleBoard(board: Board, rng: Rng, nextId: number, kinds: number): { board: Board; nextId: number } {
  const size = board.length;
  const pieces = board.flat().filter((p): p is Piece => p !== null);
  for (let attempt = 0; attempt < 200; attempt++) {
    shuffleInPlace(pieces, rng);
    const next: Board = Array.from({ length: size }, (_, r) => pieces.slice(r * size, (r + 1) * size));
    if (isPlayable(next)) return { board: next, nextId };
  }
  return generateBoard(size, kinds, rng, nextId);
}
