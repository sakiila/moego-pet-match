import type { LeaderboardView } from '../api/types';

/** 报告页「今日名次」所需的最少信息，由今日榜视图算出。 */
export interface Standing {
  rank: number;
  score: number;
  leaderScore: number;
  /** 今日榜上的人数（含自己）。 */
  participants: number;
}

/** 从今日榜视图取当前玩家的名次；榜上没有自己（尚未保存）时为 null。 */
export function todayStanding(view: LeaderboardView, playerId: string): Standing | null {
  const me = view.entries.find((e) => e.userId === playerId) ?? view.me;
  if (!me || view.entries.length === 0) return null;
  return { rank: me.rank, score: me.score, leaderScore: view.entries[0].score, participants: view.entries.length };
}

/** 北京日期（YYYY-MM-DD）按语言显示为「10 月 24 日」或「Oct 24」。 */
export function formatBoardDate(date: string, locale: 'zh' | 'en'): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  if (locale === 'zh') return `${m} 月 ${d} 日`;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
