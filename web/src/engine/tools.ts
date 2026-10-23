import type { Effect, Pos, ToolType } from './types';

const row = (r: number, size: number): Pos[] => Array.from({ length: size }, (_, c) => ({ r, c }));
const col = (c: number, size: number): Pos[] => Array.from({ length: size }, (_, r) => ({ r, c }));

const allCells = (size: number): Pos[] => Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size }));

/** 单个道具的直接清除范围：横梳清整行，竖梳清整列，剪刀清所在行与列，吹风机清全盘。 */
export function toolRange(tool: ToolType, at: Pos, size: number): Pos[] {
  if (tool === 'combH') return row(at.r, size);
  if (tool === 'combV') return col(at.c, size);
  if (tool === 'dryer') return allCells(size);
  return [...row(at.r, size), ...col(at.c, size)];
}

const isComb = (t: ToolType) => t === 'combH' || t === 'combV';

/** 两个剪刀相邻交换：合成一个吹风机，不清除任何格。 */
export const isMerge = (a: ToolType, b: ToolType) => a === 'scissors' && b === 'scissors';

/**
 * 相邻两道具交换的范围，以拖动落点为中心、到棋盘边界为止：
 * 梳＋梳清整行＋整列；梳＋剪清连续 3 行＋连续 3 列；任一为吹风机清全盘；
 * 剪＋剪是合成，没有清除范围（返回空）。
 */
export function comboRange(a: ToolType, b: ToolType, center: Pos, size: number): Pos[] {
  if (a === 'dryer' || b === 'dryer') return allCells(size);
  if (isMerge(a, b)) return [];
  if (isComb(a) && isComb(b)) return [...row(center.r, size), ...col(center.c, size)];
  const cells: Pos[] = [];
  for (let d = -1; d <= 1; d++) {
    if (center.r + d >= 0 && center.r + d < size) cells.push(...row(center.r + d, size));
    if (center.c + d >= 0 && center.c + d < size) cells.push(...col(center.c + d, size));
  }
  return cells;
}

/** 梳＋梳、梳＋剪两种合体效果；吹风机与剪＋剪合成不属于合体。 */
export function comboEffect(a: ToolType, b: ToolType): Effect {
  return isComb(a) && isComb(b) ? 'comboCC' : 'comboCS';
}

export function toolEffect(t: ToolType): Effect {
  return t === 'dryer' ? 'dryer' : isComb(t) ? 'comb' : 'scissors';
}

const EFFECT_ORDER: Effect[] = ['match', 'merge', 'comb', 'scissors', 'comboCC', 'comboCS', 'dryer'];
export const strongerEffect = (a: Effect, b: Effect): Effect =>
  EFFECT_ORDER.indexOf(a) >= EFFECT_ORDER.indexOf(b) ? a : b;
