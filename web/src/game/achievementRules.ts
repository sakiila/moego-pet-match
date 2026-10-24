/** 收集成就由服务端按已保存图鉴判定；此处的稳定 id 同时用于图片、文案与佩戴选择。 */
export const ACHIEVEMENT_IDS = ['cats', 'dogs', 'friends', 'species', 'neighbors', 'family', 'album'] as const;
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];
export type AchievementMetric = 'cats' | 'dogs' | 'collected' | 'species' | 'owners' | 'families';
export const ACHIEVEMENTS: readonly { id: AchievementId; metric: AchievementMetric; target: number | 'catalog' }[] = [
  { id: 'cats', metric: 'cats', target: 5 },
  { id: 'dogs', metric: 'dogs', target: 5 },
  { id: 'friends', metric: 'collected', target: 10 },
  { id: 'species', metric: 'species', target: 3 },
  { id: 'neighbors', metric: 'owners', target: 10 },
  { id: 'family', metric: 'families', target: 1 },
  { id: 'album', metric: 'collected', target: 'catalog' },
];
