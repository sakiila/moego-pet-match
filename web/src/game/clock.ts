/**
 * 墙钟 → 游戏时钟。只有系统洗牌会暂停；设置、退出确认与切后台都不暂停，
 * 回到前台时按实际经过的墙钟时间更新。speed 仅供开发调试快进。
 */
export interface GameClock {
  /** offsetMs 仅供开发验证：从指定游戏时刻开始。 */
  start(offsetMs?: number): void;
  elapsed(): number;
  pause(): void;
  /** 从游戏时刻 g（不晚于当前）起暂停，返回暂停起点的墙钟时间；用于按时间线精确暂停。 */
  pauseAt(g: number): number;
  /** 恢复计时；传入墙钟时刻时只扣除到该时刻为止的暂停时长。 */
  resume(at?: number): void;
  readonly paused: boolean;
  readonly started: boolean;
}

export function createGameClock(now: () => number = () => performance.now(), speed = 1): GameClock {
  let startedAt: number | null = null;
  let pausedAt: number | null = null;
  let pausedTotal = 0;
  return {
    start(offsetMs = 0) {
      startedAt = now() - offsetMs / speed;
      pausedAt = null;
      pausedTotal = 0;
    },
    elapsed() {
      if (startedAt === null) return 0;
      const end = pausedAt ?? now();
      return Math.max(0, (end - startedAt - pausedTotal) * speed);
    },
    pause() {
      if (startedAt !== null && pausedAt === null) pausedAt = now();
    },
    pauseAt(g: number) {
      if (startedAt === null) return now();
      if (pausedAt === null) pausedAt = Math.min(now(), startedAt + pausedTotal + g / speed);
      return pausedAt;
    },
    resume(at?: number) {
      if (pausedAt === null) return;
      pausedTotal += Math.max(0, Math.min(at ?? now(), now()) - pausedAt);
      pausedAt = null;
    },
    get paused() {
      return pausedAt !== null;
    },
    get started() {
      return startedAt !== null;
    },
  };
}
