import { describe, expect, it } from 'vitest';
import { parseBoard } from '../board';
import { findGroups, spawnPosition, toolForGroup } from '../match';
import { p } from './fixtures';

const groupsOf = (rows: string[]) => findGroups(parseBoard(rows).board);
const toolsOf = (rows: string[]) => groupsOf(rows).map(toolForGroup);

describe('匹配组与道具类型', () => {
  it('普通三消不出道具', () => {
    expect(toolsOf(['AAA....', ...Array(6).fill('.......')])).toEqual([null]);
  });

  it('横向四消出横梳，纵向四消出竖梳', () => {
    expect(toolsOf(['AAAA...', ...Array(6).fill('.......')])).toEqual(['combH']);
    expect(toolsOf(['A......', 'A......', 'A......', 'A......', '.......', '.......', '.......'])).toEqual(['combV']);
  });

  it.each([5, 6, 7])('横向与纵向直线 %i 连都出吹风机', (length) => {
    const horizontal = ['A'.repeat(length).padEnd(7, '.'), ...Array(6).fill('.......')];
    const vertical = Array.from({ length: 7 }, (_, r) => r < length ? 'A......' : '.......');
    expect(toolsOf(horizontal)).toEqual(['dryer']);
    expect(toolsOf(vertical)).toEqual(['dryer']);
  });

  it('五连带交叉支线时，整个匹配组只出一个吹风机', () => {
    const horizontal = ['AAAAA..', '..A....', '..A....', '.......', '.......', '.......', '.......'];
    const vertical = ['A......', 'A......', 'AAA....', 'A......', 'A......', '.......', '.......'];
    for (const shape of [horizontal, vertical]) {
      const groups = groupsOf(shape);
      expect(groups).toHaveLength(1);
      expect(groups[0].cells).toHaveLength(7);
      expect(groups.map(toolForGroup)).toEqual(['dryer']);
    }
  });

  it('L、T、＋ 形至少五格出剪刀', () => {
    const L = ['A......', 'A......', 'AAA....', '.......', '.......', '.......', '.......'];
    const T = ['AAA....', '.A.....', '.A.....', '.......', '.......', '.......', '.......'];
    const plus = ['.A.....', 'AAA....', '.A.....', '.......', '.......', '.......', '.......'];
    for (const shape of [L, T, plus]) {
      const groups = groupsOf(shape);
      expect(groups).toHaveLength(1);
      expect(groups[0].cells).toHaveLength(5);
      expect(toolForGroup(groups[0])).toBe('scissors');
    }
  });

  it('横四与竖三交叉（6 格）剪刀优先', () => {
    const shape = ['AAAA...', 'A......', 'A......', '.......', '.......', '.......', '.......'];
    const groups = groupsOf(shape);
    expect(groups).toHaveLength(1);
    expect(groups[0].cells).toHaveLength(6);
    expect(toolForGroup(groups[0])).toBe('scissors');
  });

  it('并排紧挨但不相交的两条三连是两个独立三消', () => {
    const shape = ['AAA....', 'AAA....', '.......', '.......', '.......', '.......', '.......'];
    const groups = groupsOf(shape);
    expect(groups).toHaveLength(2);
    expect(groups.map(toolForGroup)).toEqual([null, null]);
  });
});

describe('新道具生成位置', () => {
  const [h4] = groupsOf(['.AAAA..', ...Array(6).fill('.......')]);

  it('手动交换：落点在组内时放在落点', () => {
    expect(spawnPosition(h4, { from: p(1, 2), to: p(0, 2) })).toEqual(p(0, 2));
  });

  it('手动交换：落点不在组内时用组内另一个交换格', () => {
    expect(spawnPosition(h4, { from: p(0, 3), to: p(1, 3) })).toEqual(p(0, 3));
  });

  it('自动下落：同距时取更靠右', () => {
    // 中心 (0, 2.5)，(0,2) 与 (0,3) 同距
    expect(spawnPosition(h4)).toEqual(p(0, 3));
  });

  it('自动下落：同距时取更靠下', () => {
    const [v4] = groupsOf(['.......', '.......', '.......', 'A......', 'A......', 'A......', 'A......']);
    // 中心 (4.5, 0)，(4,0) 与 (5,0) 同距
    expect(spawnPosition(v4)).toEqual(p(5, 0));
  });

  it('自动下落：L 形取最接近几何中心的格子，同距取更靠下', () => {
    const [L] = groupsOf(['A......', 'A......', 'AAA....', '.......', '.......', '.......', '.......']);
    // 中心 (1.4, 0.6)：(1,0) 与 (2,1) 距离² 均为 0.52，拐角 (2,0) 为 0.72
    expect(spawnPosition(L)).toEqual(p(2, 1));
  });
});
