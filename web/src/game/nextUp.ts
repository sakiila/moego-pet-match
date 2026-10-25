import type { AchievementStatus } from '../api/types';
import { ACHIEVEMENTS, type AchievementId } from './achievementRules';

const TOOL_TIPS = ['comb', 'scissors', 'dryer', 'comb_comb', 'comb_scissors', 'scissors_scissors'] as const;

/** 报告尾声「店长说」：每局一句玩法提示或进度预告。 */
export type NextUp =
  | { kind: 'tip'; id: typeof TOOL_TIPS[number] }
  | { kind: 'fish'; rounds: 1 | 2 }
  | { kind: 'achievement'; id: AchievementId; remaining: number }
  | { kind: 'milestone'; percent: 25 | 50 | 75; remaining: number }
  | { kind: 'tomorrow' };

export interface NextUpInput {
  /** 用对局 ID 固定本局抽签，重渲染、竞猜加分和切换语言不重新抽取。 */
  gameId: string;
  /** 本局结算后的进度（SettleResponse.progress）。 */
  progress: { completedNormalGames: number; fishUnlocked: boolean };
  /** 成就进度；读取失败时传 null，仍可展示玩法提示、鱼关预告和兜底。 */
  achievements: AchievementStatus[] | null;
}

/** 鱼关解锁所需的有效完整普通局数（与服务端 FISH_UNLOCK_GAMES 一致）。 */
export const FISH_UNLOCK_GAMES = 3;
/** 成就只在还差这么多以内时预告。 */
export const ACHIEVEMENT_NEAR = 3;
/** 图鉴里程碑只在还差这么多只以内时预告。 */
export const MILESTONE_NEAR = 5;
const MILESTONES = [25, 50, 75] as const;

/**
 * 一半对局展示随机工具提示，另一半按以下优先级预告进度，命中第一条就停：
 * 1. 未解锁鱼关且还差 1–2 局；2. 最近的未解锁成就（已有进展且还差 ≤ 3，取差得最少的，平手按成就表顺序）；
 * 3. 图鉴 25% / 50% / 75% 里程碑（还差 ≤ 5 只）；4. 兜底：明天换新棋盘。
 * 100% 由「全员点名」成就承接，不再单独算里程碑。
 * 「一家都熟」按整家计数（0 → 1），客户端看不出离凑齐一家还有多远，不参与预告。
 */
export function pickNextUp({ gameId, progress, achievements }: NextUpInput): NextUp {
  let hash = 2166136261;
  for (let i = 0; i < gameId.length; i++) {
    hash = Math.imul(hash ^ gameId.charCodeAt(i), 16777619);
  }
  const slot = (hash >>> 0) % (TOOL_TIPS.length * 2);
  if (slot < TOOL_TIPS.length) return { kind: 'tip', id: TOOL_TIPS[slot] };

  const rounds = FISH_UNLOCK_GAMES - progress.completedNormalGames;
  if (!progress.fishUnlocked && (rounds === 1 || rounds === 2)) return { kind: 'fish', rounds };

  if (achievements) {
    let best: { id: AchievementId; remaining: number } | null = null;
    for (const rule of ACHIEVEMENTS) {
      const status = achievements.find((a) => a.id === rule.id);
      if (rule.id === 'family' || !status || status.unlockedAt || status.target <= 0) continue;
      const remaining = status.target - status.current;
      if (status.current < 1 || remaining < 1 || remaining > ACHIEVEMENT_NEAR) continue;
      if (!best || remaining < best.remaining) best = { id: rule.id, remaining };
    }
    if (best) return { kind: 'achievement', ...best };

    const album = achievements.find((a) => a.id === 'album');
    if (album && album.target > 0) {
      for (const percent of MILESTONES) {
        const threshold = Math.ceil((album.target * percent) / 100);
        const remaining = threshold - album.current;
        if (remaining >= 1 && remaining <= MILESTONE_NEAR) return { kind: 'milestone', percent, remaining };
        if (remaining > MILESTONE_NEAR) break;
      }
    }
  }
  return { kind: 'tomorrow' };
}
