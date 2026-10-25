/** 前后端共用的接口数据形状；server 直接引用本文件。 */
import type { AchievementId } from '../game/achievementRules.ts';
export type { AchievementId } from '../game/achievementRules.ts';

export interface AchievementStatus {
  id: AchievementId;
  current: number;
  target: number;
  unlockedAt: string | null;
}
export interface AchievementView {
  achievements: AchievementStatus[];
  equippedTitle: AchievementId | null;
}

export type GameMode = 'normal' | 'fish';

/** 排行榜公开名片：不暴露邮箱、原始对局 payload 或宠物主人关系。 */
export interface PlayerProfileView {
  userId: string;
  name: string;
  mode: GameMode;
  bestScore: number | null;
  completedGames: number;
  collection: { collected: number; total: number };
  equippedTitle: AchievementId | null;
  unlockedTitles: AchievementId[];
  recentGames: { gameId: string; completedAt: string; score: number; newCollected: number }[];
}

export interface ColleagueResult {
  userId: string;
  name: string;
}

/** 连续开工天数：days 为连续天数（今天没开则连到昨天），today 为今天是否已开工。 */
export interface Streak {
  days: number;
  today: boolean;
}

export interface PlayerView {
  userId: string;
  name: string;
  best: { normal: number | null; fish: number | null };
  progress: { completedNormalGames: number; fishUnlocked: boolean };
  equippedTitle?: AchievementId | null;
  streak: Streak;
}

export interface LineupPet {
  petId: string;
  name: string;
  /** 鱼色有中英文名；宠物名保留原文，不设英文名。 */
  nameEn?: string;
}

export interface RegisteredGame {
  gameId: string;
  seed: number;
  rulesVersion: number;
  mode: GameMode;
  lineup: LineupPet[];
  /** 本局入选的自家宠物（普通局），用于准备页「{petName} 也来啦！」。 */
  ownPetIds: string[];
  /** 本局阵容中玩家尚未收集的宠物（局中新宠暂记提示用）。 */
  uncollectedPetIds: string[];
  /** 本局阵容中属于同主多宠家庭的宠物 → 家庭标识（双宠团聚用）。 */
  families: Record<string, string>;
}

/** 客户端提交的冻结结果（来自引擎 getSummary）。 */
export interface ResultPayload {
  rulesVersion: number;
  /** 正常到时完成；主动退出的局不提交。 */
  completed: true;
  score: number;
  clearedCells: number;
  clearedByMultiplier: number[];
  rushSucceeded: boolean;
  maxChain: number;
  toolsFired: number;
  validMoves: number;
  actedInLastSeconds: boolean;
  pets: { id: string; served: number; firstServedSeq: number | null }[];
}

export interface SettleResponse {
  gameId: string;
  /** 本局总分：引擎原始分，加上已答对的猜主人奖励。 */
  score: number;
  personalBest: { previous: number | null; current: number; isNew: boolean };
  /** 本局新收集的宠物（仅普通局）。 */
  newCollected: LineupPet[];
  progress: { completedNormalGames: number; fishUnlocked: boolean; unlockedNow: boolean; counted: boolean };
  /** 符合频率与资格时的猜主人题目；不揭晓答案。 */
  quiz: QuizQuestion | null;
  /** 本局阵容里当前已下架的宠物（按当前目录计算）：报告与分享卡不再展示它们的资料。 */
  removedPetIds: string[];
  /** 本局首次授予的成就；旧结算快照可能没有此字段。 */
  newAchievements?: AchievementId[];
  /** 结算后的连续开工天数；firstToday 为本局是否今天第一次打卡。旧结算快照可能没有此字段。 */
  streak?: Streak & { firstToday: boolean };
}

export interface QuizQuestion {
  quizId: string;
  petId: string;
  petName: string;
  options: { userId: string; name: string }[];
}

export interface QuizResult {
  correct: boolean | null;
  skipped: boolean;
  owner: { userId: string; name: string };
  /** 本题带来的加分：答对为固定奖励，答错或跳过为 0。 */
  bonus: number;
  /** 作答后的本局总分与个人最好成绩。 */
  score: number;
  personalBest: SettleResponse['personalBest'];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  equippedTitle?: AchievementId | null;
}

export type LeaderboardScope = 'today' | 'all';

export interface LeaderboardView {
  mode: GameMode;
  /** today：当天（北京自然日）每人最好；all：个人历史最好。 */
  scope: LeaderboardScope;
  /** 服务端当前的北京日期（YYYY-MM-DD），今日榜据此显示。 */
  date: string;
  /** 按名次排序的全部已保存成绩（同分并列 1、2、2、4）。 */
  entries: LeaderboardEntry[];
  /** 当前玩家在本模式的名次；没有已保存成绩为 null。 */
  me: LeaderboardEntry | null;
}

export interface CollectionPet {
  petId: string;
  name: string;
  collected: boolean;
  /** 首次保存收集的时间（新收集靠前排序用）。 */
  collectedAt: string | null;
  /** 只对已收集宠物或玩家自己的宠物返回，未收集不泄露主人。 */
  owner: { userId: string; name: string } | null;
  own: boolean;
}

export interface CollectionView {
  total: number;
  collected: number;
  pets: CollectionPet[];
  /** 贴纸册格位：petId 按主人英文名、再按宠物英文名排列；不含主人信息。 */
  sheetOrder: string[];
}

export interface PetDetail {
  petId: string;
  name: string;
  collected: boolean;
  own: boolean;
  owner: { userId: string; name: string } | null;
  /** 主人说：owner_quote 优先，否则飞书原介绍；未收集或没有内容为 null。 */
  quote: string | null;
  hasPhoto: boolean;
  listed: boolean;
  /** 认识人数包含已收集的当前用户，头像取最近收集的至多 5 位同事；只对已收集或自家宠物返回，否则为 null。 */
  knownBy: { count: number; recent: { userId: string; name: string }[] } | null;
}

/** 服务端当前运行的版本：构建版本（本地开发为 null）与引擎规则版本；首页据此提示旧页面刷新。 */
export interface VersionInfo {
  version: string | null;
  rulesVersion: number;
}

export interface DailyManager {
  /** 北京时间日期 YYYY-MM-DD。 */
  date: string;
  pet: { petId: string; name: string };
}

/** 删除申请状态：提交后待处理，人工核实并清理后为已处理。 */
export type DeletionStatus = 'pending' | 'processed';

export interface MyPet {
  petId: string;
  name: string;
  collected: boolean;
  /** 这只宠物最近一条删除申请；没有申请为 null。 */
  request: { status: DeletionStatus } | null;
}

export interface DeletionRequestView {
  requestId: string;
  /** 一般申请或宠物已下架时为 null。 */
  petId: string | null;
  petName: string | null;
  status: DeletionStatus;
  createdAt: string;
}
