/** 规则版本：6 增加开局授权与服务端回放协议，计分仍沿用版本 5。 */
export const RULES_VERSION = 6;

/** 已确认的首版规则数值（V1_RULES / GAME_FLOW）。 */
export const RULES = {
  size: 7,
  kinds: 6,
  durationMs: 90_000,
  rush: { startMs: 30_000, endMs: 50_000, target: 12, bonus: 1000 },
  baseScore: 100,
  maxMultiplier: 5,
  lastSecondsMs: 3_000,
  hintIdleMs: 5_000,
} as const;

/**
 * 时间线时长（游戏时钟毫秒）。取自已接受的动效试玩初值：
 * 交换 + 清除 + 补落 = 三消 440、梳子 500、剪刀 540、梳＋梳 540、梳＋剪 580；
 * 两剪刀合成吹风机 200 + 交换与补落、吹风机清全盘 360 + 交换与补落（本版新增，待试玩调整）。
 * 可随试玩调整；引擎用它们推算每批的结算时刻与棋盘忙碌区间。
 */
export const TIMING = {
  swapMs: 120,
  bounceMs: 240,
  fallMs: 140,
  clearMs: {
    match: 180,
    comb: 240,
    scissors: 280,
    comboCC: 280,
    comboCS: 320,
    merge: 200,
    dryer: 360,
  },
} as const;

/**
 * 补落导演参数。补落时只看落点的局部形态给各类加权，不按宠物身份加权：
 * 落定后能与已稳定邻居（下方、左右）直接形成三连的种类拿 boost3，形成「差一个」的种类拿 boost2，
 * 其余权重 1。加权部分 = (base + luck × 运气) × 阶段系数；运气随玩家连续无连消的步数上升。
 * 定义放在本文件，因为服务端也直接引用 config.ts。
 */
export interface DirectorConfig {
  /** 形成三连的加权：base 恒有，luck 随运气 0…1 线性叠加。 */
  boost3: { base: number; luck: number };
  /** 形成「差一个」（两连）的加权。 */
  boost2: { base: number; luck: number };
  /** 连续多少步无连消时运气达到 1。 */
  droughtCap: number;
  /** 阶段系数，按游戏时钟半开区间取最后一个 fromMs ≤ t 的项；须按 fromMs 升序且首项 fromMs 为 0。 */
  phases: { fromMs: number; factor: number }[];
}

/**
 * 补落导演默认参数（V1_RULES「补落导演」，2026-10-24 确认，可随试玩调整）。
 * 加权只看落点局部形态，不看宠物身份；运气在连续 4 步无连消时到顶；
 * 阶段：开局基线、催单期略高、催单后回落、最后 15 秒冲刺最高。
 */
export const DIRECTOR: DirectorConfig = {
  boost3: { base: 0.6, luck: 2.4 },
  boost2: { base: 0.3, luck: 0.6 },
  droughtCap: 4,
  phases: [
    { fromMs: 0, factor: 1 },
    { fromMs: 30_000, factor: 1.3 },
    { fromMs: 50_000, factor: 1 },
    { fromMs: 75_000, factor: 1.8 },
  ],
};
