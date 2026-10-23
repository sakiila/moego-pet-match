import { describe, expect, it } from 'vitest';
import { comboRange, isMerge, toolRange } from '../tools';
import { p } from './fixtures';

const unique = (cells: { r: number; c: number }[]) => new Set(cells.map((x) => `${x.r},${x.c}`)).size;

describe('道具范围', () => {
  it('横梳清整行、竖梳清整列、剪刀清十字', () => {
    expect(unique(toolRange('combH', p(3, 3), 7))).toBe(7);
    expect(unique(toolRange('combV', p(3, 3), 7))).toBe(7);
    expect(unique(toolRange('scissors', p(3, 3), 7))).toBe(13);
  });

  it('吹风机清全盘 49 格，与位置无关', () => {
    expect(unique(toolRange('dryer', p(3, 3), 7))).toBe(49);
    expect(unique(toolRange('dryer', p(0, 6), 7))).toBe(49);
  });

  it('7×7 落点居中：梳＋梳 13、梳＋剪 33；任一为吹风机 49 格；剪＋剪只合成、无清除范围', () => {
    expect(unique(comboRange('combH', 'combV', p(3, 3), 7))).toBe(13);
    expect(unique(comboRange('combH', 'scissors', p(3, 3), 7))).toBe(33);
    expect(unique(comboRange('dryer', 'combH', p(3, 3), 7))).toBe(49);
    expect(comboRange('scissors', 'scissors', p(3, 3), 7)).toEqual([]);
    expect(isMerge('scissors', 'scissors')).toBe(true);
    expect(isMerge('scissors', 'combH')).toBe(false);
  });

  it('合体范围在棋盘边缘裁切', () => {
    expect(unique(comboRange('combH', 'combH', p(0, 0), 7))).toBe(13);
    // 第 0、1 行 + 第 0、1 列：14 + 14 − 4
    expect(unique(comboRange('scissors', 'combV', p(0, 0), 7))).toBe(24);
  });
});
