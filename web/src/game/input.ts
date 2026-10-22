import type { Pos } from '../engine';

/** 输入手感参数；触发距离仍待试玩调节。 */
export const INPUT = {
  /** 位移小于此值松手视为点选。 */
  tapSlopPx: 8,
  /** 位移超过此值且方向明确，开始高亮目标与范围预览。 */
  aimMinPx: 10,
  /** 位移达到格宽的此比例即立即尝试交换（滑到就交换）。 */
  triggerRatio: 0.45,
} as const;

export type DragStage = 'none' | 'aim' | 'trigger';

/** 按主方向判定相邻目标；斜拖取位移更大的轴，棋盘外无目标。 */
export function resolveDrag(origin: Pos, dx: number, dy: number, cellPx: number, size: number): { stage: DragStage; target: Pos | null } {
  const dist = Math.max(Math.abs(dx), Math.abs(dy));
  if (dist < INPUT.aimMinPx) return { stage: 'none', target: null };
  const target = Math.abs(dx) >= Math.abs(dy) ? { r: origin.r, c: origin.c + Math.sign(dx) } : { r: origin.r + Math.sign(dy), c: origin.c };
  if (target.r < 0 || target.r >= size || target.c < 0 || target.c >= size) return { stage: 'none', target: null };
  return { stage: dist >= cellPx * INPUT.triggerRatio ? 'trigger' : 'aim', target };
}

export type TapResult =
  | { kind: 'select'; selected: Pos }
  | { kind: 'deselect' }
  | { kind: 'swap'; from: Pos; to: Pos };

/** 点选辅助：同格取消，相邻格尝试交换（落点为第二次点击的格子），非相邻改选。 */
export function resolveTap(selected: Pos | null, cell: Pos): TapResult {
  if (!selected) return { kind: 'select', selected: cell };
  if (selected.r === cell.r && selected.c === cell.c) return { kind: 'deselect' };
  if (Math.abs(selected.r - cell.r) + Math.abs(selected.c - cell.c) === 1) return { kind: 'swap', from: selected, to: cell };
  return { kind: 'select', selected: cell };
}
