import type { AchievementId } from '../api/types';

/** 稳定分组 id 仅供显示映射；用户看到的等级名来自 i18n，不参与解锁判定。 */
export const ACHIEVEMENT_RARITY = {
  cats: 'common', dogs: 'common', friends: 'common',
  neighbors: 'rare', family: 'rare', species: 'epic', album: 'legendary',
} as const satisfies Record<AchievementId, string>;

/** 仅用于界面展示；已解锁优先时也在各组内保持此顺序。 */
export const ACHIEVEMENT_DISPLAY_ORDER: readonly AchievementId[] = [
  'cats', 'dogs', 'friends', 'neighbors', 'family', 'species', 'album',
];
