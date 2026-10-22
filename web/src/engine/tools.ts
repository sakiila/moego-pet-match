import type { Effect, Pos, ToolType } from './types';

const row = (r: number, size: number): Pos[] => Array.from({ length: size }, (_, c) => ({ r, c }));
const col = (c: number, size: number): Pos[] => Array.from({ length: size }, (_, r) => ({ r, c }));

/** 单个道具的直接清除范围：横梳清整行，竖梳清整列，剪刀清所在行与列。 */
export function toolRange(tool: ToolType, at: Pos, size: number): Pos[] {
  if (tool === 'combH') return row(at.r, size);
  if (tool === 'combV') return col(at.c, size);
  return [...row(at.r, size), ...col(at.c, size)];
}

const isComb = (t: ToolType) => t !== 'scissors';

/**
 * 相邻两道具合体，以拖动落点为中心、到棋盘边界为止：
 * 梳＋梳清整行＋整列；梳＋剪清连续 3 行＋连续 3 列；剪＋剪清全盘。
 */
export function comboRange(a: ToolType, b: ToolType, center: Pos, size: number): Pos[] {
  if (isComb(a) && isComb(b)) return [...row(center.r, size), ...col(center.c, size)];
  if (isComb(a) !== isComb(b)) {
    const cells: Pos[] = [];
    for (let d = -1; d <= 1; d++) {
      if (center.r + d >= 0 && center.r + d < size) cells.push(...row(center.r + d, size));
      if (center.c + d >= 0 && center.c + d < size) cells.push(...col(center.c + d, size));
    }
    return cells;
  }
  return Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size }));
}

export function comboEffect(a: ToolType, b: ToolType): Effect {
  if (isComb(a) && isComb(b)) return 'comboCC';
  return isComb(a) !== isComb(b) ? 'comboCS' : 'comboSS';
}

export const toolEffect = (t: ToolType): Effect => (isComb(t) ? 'comb' : 'scissors');

const EFFECT_ORDER: Effect[] = ['match', 'comb', 'scissors', 'comboCC', 'comboCS', 'comboSS'];
export const strongerEffect = (a: Effect, b: Effect): Effect =>
  EFFECT_ORDER.indexOf(a) >= EFFECT_ORDER.indexOf(b) ? a : b;
