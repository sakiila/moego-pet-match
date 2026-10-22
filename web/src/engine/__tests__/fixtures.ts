import { createGame } from '../game';
import type { GameState, Pos } from '../types';

export const LINEUP = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

/** kind = (c + 2r) % 6：没有现成匹配，也没有任何有效交换（死局）。 */
export const DEAD = ['ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA'];

export function withCells(base: string[], cells: Record<string, string>): string[] {
  const rows = base.map((r) => [...r]);
  for (const [key, ch] of Object.entries(cells)) {
    const [r, c] = key.split(',').map(Number);
    rows[r][c] = ch;
  }
  return rows.map((r) => r.join(''));
}

export function game(board: string[], refill: number[] = []): GameState {
  return createGame({ seed: 1, lineup: LINEUP, board, refill });
}

export const p = (r: number, c: number): Pos => ({ r, c });
