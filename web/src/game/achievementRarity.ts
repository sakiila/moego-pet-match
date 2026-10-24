import type { AchievementId } from '../api/types';

export const ACHIEVEMENT_RARITY = {
  cats: 'common', dogs: 'common', friends: 'common',
  neighbors: 'rare', family: 'rare', species: 'epic', album: 'legendary',
} as const satisfies Record<AchievementId, string>;
