/** 收集成就由服务端按已保存图鉴判定；此处的稳定 id 同时用于图片、文案与佩戴选择。 */
export const ACHIEVEMENT_IDS = ['cats', 'dogs', 'friends', 'species', 'neighbors', 'family', 'album', 'hotpot'] as const;
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];
export type AchievementMetric = 'cats' | 'dogs' | 'collected' | 'species' | 'owners' | 'families';
/** 按累计图鉴判定的七项收集成就；隐藏成就不在此表（见下）。 */
export const ACHIEVEMENTS: readonly { id: AchievementId; metric: AchievementMetric; target: number | 'catalog' }[] = [
  { id: 'cats', metric: 'cats', target: 5 },
  { id: 'dogs', metric: 'dogs', target: 5 },
  { id: 'friends', metric: 'collected', target: 10 },
  { id: 'species', metric: 'species', target: 3 },
  { id: 'neighbors', metric: 'owners', target: 10 },
  { id: 'family', metric: 'families', target: 1 },
  { id: 'album', metric: 'collected', target: 'catalog' },
];

/**
 * 隐藏成就「火锅搭子」（2026-10-25 开发者彩蛋）：同一局里毛肚与菠萝都至少服务一次，结算时授予。
 * 解锁前在「我的称号」里只是带灰蒙层的「隐藏称号」占位（只露稀有度），不进玩家名片徽章与预告；两只的名录 id 固定，改名不影响。
 */
export const HOTPOT_PETS = ['pet_644053d683e0', 'pet_2f55c03f6968'] as const;
export const HIDDEN_ACHIEVEMENT_IDS: readonly AchievementId[] = ['hotpot'];
/**
 * 隐藏称号的名称与解锁条件只给自己已解锁的人看；未解锁时使用隐藏名称与喵喵喵条件。
 * unlockedByViewer 为正在看的玩家已解锁的称号；还没读到时传空，按未解锁处理。
 */
export const conditionRevealed = (id: AchievementId, unlockedByViewer: readonly AchievementId[]) =>
  !HIDDEN_ACHIEVEMENT_IDS.includes(id) || unlockedByViewer.includes(id);
/** 本局服务到的宠物 id 是否满足「火锅搭子」。 */
export const servedHotpot = (servedPetIds: readonly string[]) => HOTPOT_PETS.every((id) => servedPetIds.includes(id));
