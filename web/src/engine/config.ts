/** 规则版本：对局登记与结算时校验，规则或计分口径变化时递增。 */
export const RULES_VERSION = 2;

/** 已确认的首版规则数值（V1_RULES / GAME_FLOW）。 */
export const RULES = {
  size: 7,
  kinds: 6,
  durationMs: 90_000,
  rush: { startMs: 30_000, endMs: 50_000, target: 12, bonus: 100 },
  baseScore: 10,
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
