import { describe, expect, it } from 'vitest';
import type { LeaderboardView } from '../../api/types';
import { formatBoardDate, todayStanding } from '../standing';

const view = (entries: [number, string, number][], me: string | null = null): LeaderboardView => ({
  mode: 'normal',
  scope: 'today',
  date: '2026-10-24',
  entries: entries.map(([rank, userId, score]) => ({ rank, userId, name: userId, score })),
  me: me ? { rank: entries.find((e) => e[1] === me)![0], userId: me, name: me, score: entries.find((e) => e[1] === me)![2] } : null,
});

describe('今日名次', () => {
  it('取自己的名次、分数、第一名分数与人数', () => {
    expect(todayStanding(view([[1, 'alice', 4100], [2, 'bob', 2480], [2, 'zhang', 2480]], 'bob'), 'bob')).toEqual({
      rank: 2,
      score: 2480,
      leaderScore: 4100,
      participants: 3,
    });
  });

  it('自己是第一名时第一名分数就是自己', () => {
    expect(todayStanding(view([[1, 'bob', 4100], [2, 'alice', 2480]], 'bob'), 'bob')).toMatchObject({ rank: 1, leaderScore: 4100 });
  });

  it('只有自己时人数为 1', () => {
    expect(todayStanding(view([[1, 'bob', 900]], 'bob'), 'bob')?.participants).toBe(1);
  });

  it('榜上没有自己（尚未保存或今天没打）为 null', () => {
    expect(todayStanding(view([[1, 'alice', 4100]]), 'bob')).toBeNull();
    expect(todayStanding(view([]), 'bob')).toBeNull();
  });
});

describe('日期显示', () => {
  it('中文「10 月 24 日」，英文「Oct 24」', () => {
    expect(formatBoardDate('2026-10-24', 'zh')).toBe('10 月 24 日');
    expect(formatBoardDate('2026-10-24', 'en')).toBe('Oct 24');
    expect(formatBoardDate('2026-01-05', 'zh')).toBe('1 月 5 日');
  });
  it('格式异常时原样返回', () => {
    expect(formatBoardDate('today', 'zh')).toBe('today');
  });
});
