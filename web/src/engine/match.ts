import { posKey } from './board';
import type { Board, Pos, ToolType } from './types';

export interface Line {
  kind: number;
  dir: 'h' | 'v';
  cells: Pos[];
}

export interface Group {
  kind: number;
  cells: Pos[];
  lines: Line[];
}

const petKind = (board: Board, r: number, c: number) => {
  const p = board[r][c];
  return p?.type === 'pet' ? p.kind : null;
};

/** 同类宠物（鱼关为同一鱼色）的横向与纵向连续 ≥ 3 格。道具不参与匹配。 */
export function findLines(board: Board): Line[] {
  const size = board.length;
  const lines: Line[] = [];
  for (const dir of ['h', 'v'] as const) {
    for (let a = 0; a < size; a++) {
      let start = 0;
      for (let b = 1; b <= size; b++) {
        const at = (i: number) => (dir === 'h' ? petKind(board, a, i) : petKind(board, i, a));
        const kind = at(start);
        if (b < size && kind !== null && at(b) === kind) continue;
        if (kind !== null && b - start >= 3) {
          const cells: Pos[] = [];
          for (let i = start; i < b; i++) cells.push(dir === 'h' ? { r: a, c: i } : { r: i, c: a });
          lines.push({ kind, dir, cells });
        }
        start = b;
      }
    }
  }
  return lines;
}

/** 只有共享格子的匹配线才合成一组；并排而不相交的匹配线各自独立。 */
export function findGroups(board: Board): Group[] {
  const size = board.length;
  const lines = findLines(board);
  const parent = lines.map((_, i) => i);
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i])));
  const owner = new Map<number, number>();
  lines.forEach((line, i) => {
    for (const cell of line.cells) {
      const k = posKey(cell, size);
      const other = owner.get(k);
      if (other === undefined) owner.set(k, i);
      else parent[root(i)] = root(other);
    }
  });

  const byRoot = new Map<number, Group>();
  lines.forEach((line, i) => {
    const r = root(i);
    let group = byRoot.get(r);
    if (!group) {
      group = { kind: line.kind, cells: [], lines: [] };
      byRoot.set(r, group);
    }
    group.lines.push(line);
  });
  for (const group of byRoot.values()) {
    const seen = new Map<number, Pos>();
    for (const line of group.lines) for (const cell of line.cells) seen.set(posKey(cell, size), cell);
    group.cells = [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => p);
  }
  return [...byRoot.values()].sort((a, b) => posKey(a.cells[0], size) - posKey(b.cells[0], size));
}

/** 直线五连及以上、或横纵交叉且至少五个独立格（L / T / ＋）出剪刀；直线四消出对应方向的梳子。 */
export function toolForGroup(group: Group): ToolType | null {
  const longest = Math.max(...group.lines.map((l) => l.cells.length));
  const crossed = group.lines.some((l) => l.dir === 'h') && group.lines.some((l) => l.dir === 'v');
  if (longest >= 5 || (crossed && group.cells.length >= 5)) return 'scissors';
  if (longest === 4) return group.lines.find((l) => l.cells.length === 4)!.dir === 'h' ? 'combH' : 'combV';
  return null;
}

/**
 * 新道具位置：手动交换优先放在拖动落点，落点不在组内则用另一交换格；
 * 自动下落匹配取最接近几何中心的格子，同距取更靠下、再更靠右。
 */
export function spawnPosition(group: Group, swap?: { from: Pos; to: Pos }): Pos {
  const has = (p: Pos) => group.cells.some((c) => c.r === p.r && c.c === p.c);
  if (swap) {
    if (has(swap.to)) return swap.to;
    if (has(swap.from)) return swap.from;
  }
  const n = group.cells.length;
  const cr = group.cells.reduce((s, p) => s + p.r, 0) / n;
  const cc = group.cells.reduce((s, p) => s + p.c, 0) / n;
  const dist = (p: Pos) => (p.r - cr) ** 2 + (p.c - cc) ** 2;
  return group.cells.reduce((best, p) => {
    const d = dist(p) - dist(best);
    if (Math.abs(d) > 1e-9) return d < 0 ? p : best;
    if (p.r !== best.r) return p.r > best.r ? p : best;
    return p.c > best.c ? p : best;
  });
}
