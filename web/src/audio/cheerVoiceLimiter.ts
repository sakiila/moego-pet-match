import type { CheerKind } from '../game/cheers';

const COOLDOWN_MS: Record<CheerKind, number> = { nice: 6000, great: 3000, amazing: 3000, wow: 3000 };

/** 每句话独立限频；只有实际播放才记时，跳过的声音不排队。 */
export function createCheerVoiceLimiter() {
  const lastPlayed = new Map<CheerKind, number>();

  return {
    tryPlay: (kind: CheerKind, nowMs: number, play: (kind: CheerKind) => boolean) => {
      const last = lastPlayed.get(kind);
      if (last !== undefined && nowMs - last < COOLDOWN_MS[kind]) return false;
      if (!play(kind)) return false;
      lastPlayed.set(kind, nowMs);
      return true;
    },
    reset: () => { lastPlayed.clear(); },
  };
}
