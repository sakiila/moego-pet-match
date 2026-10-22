import type { Board, Piece, Pos, ToolType } from './types';

const TOOL_CHARS: Record<string, ToolType> = { h: 'combH', v: 'combV', x: 'scissors' };
const CHAR_OF_TOOL: Record<ToolType, string> = { combH: 'h', combV: 'v', scissors: 'x' };

export const posKey = (p: Pos, size: number) => p.r * size + p.c;
export const keyPos = (k: number, size: number): Pos => ({ r: Math.floor(k / size), c: k % size });

export function inBounds(p: Pos, size: number): boolean {
  return p.r >= 0 && p.r < size && p.c >= 0 && p.c < size;
}

export function isAdjacent(a: Pos, b: Pos): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

/**
 * ASCII 夹具：`A`–`F` 为宠物 kind 0–5，`h` / `v` / `x` 为横梳 / 竖梳 / 剪刀，`.` 为空。
 */
export function parseBoard(rows: string[], firstId = 1): { board: Board; nextId: number } {
  let nextId = firstId;
  const board = rows.map((row) =>
    [...row].map((ch): Piece | null => {
      if (ch === '.') return null;
      if (ch in TOOL_CHARS) return { id: nextId++, type: 'tool', tool: TOOL_CHARS[ch] };
      const kind = ch.charCodeAt(0) - 65;
      if (kind < 0 || kind > 25) throw new Error(`Unknown board char "${ch}"`);
      return { id: nextId++, type: 'pet', kind };
    }),
  );
  if (board.some((row) => row.length !== board.length)) throw new Error('Board must be square');
  return { board, nextId };
}

export function formatBoard(board: Board): string[] {
  return board.map((row) =>
    row
      .map((p) => (p === null ? '.' : p.type === 'tool' ? CHAR_OF_TOOL[p.tool] : String.fromCharCode(65 + p.kind)))
      .join(''),
  );
}

export function hasTool(board: Board): boolean {
  return board.some((row) => row.some((p) => p?.type === 'tool'));
}
