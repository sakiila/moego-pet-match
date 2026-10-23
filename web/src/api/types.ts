/** 前后端共用的接口数据形状；server 直接引用本文件。 */
export type GameMode = 'normal' | 'fish';

export interface ColleagueResult {
  userId: string;
  name: string;
}

export interface PlayerView {
  userId: string;
  name: string;
  best: { normal: number | null; fish: number | null };
  progress: { completedNormalGames: number; fishUnlocked: boolean };
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
  score: number;
  personalBest: { previous: number | null; current: number; isNew: boolean };
  /** 本局新收集的宠物（仅普通局）。 */
  newCollected: LineupPet[];
  progress: { completedNormalGames: number; fishUnlocked: boolean; unlockedNow: boolean; counted: boolean };
  /** 符合频率与资格时的猜主人题目；不揭晓答案。 */
  quiz: QuizQuestion | null;
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
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
}

export interface LeaderboardView {
  mode: GameMode;
  /** 按名次排序的全部已保存成绩（同分并列 1、2、2、4）。 */
  entries: LeaderboardEntry[];
  /** 当前玩家在本模式的名次；没有已保存成绩为 null。 */
  me: LeaderboardEntry | null;
}
