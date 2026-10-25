import { describe, expect, it } from 'vitest';
import type { CheerKind } from '../game/cheers';
import { createCheerVoiceLimiter } from './cheerVoiceLimiter';

function voice() {
  const played: CheerKind[] = [];
  return {
    played,
    play: (kind: CheerKind) => { played.push(kind); return true; },
    limiter: createCheerVoiceLimiter(),
  };
}

describe('per-phrase cheer voice cooldowns', () => {
  it('allows Nice at 6000 ms and skips it at 5999 ms without calling playback', () => {
    const { limiter, play, played } = voice();

    expect(limiter.tryPlay('nice', 0, play)).toBe(true);
    expect(limiter.tryPlay('nice', 5999, play)).toBe(false);
    expect(played).toEqual(['nice']);
    expect(limiter.tryPlay('nice', 6000, play)).toBe(true);
    expect(played).toEqual(['nice', 'nice']);
  });

  it.each(['great', 'amazing', 'wow'] as const)('allows %s at 3000 ms and skips it at 2999 ms', (kind) => {
    const { limiter, play, played } = voice();

    expect(limiter.tryPlay(kind, 0, play)).toBe(true);
    expect(limiter.tryPlay(kind, 2999, play)).toBe(false);
    expect(played).toEqual([kind]);
    expect(limiter.tryPlay(kind, 3000, play)).toBe(true);
    expect(played).toEqual([kind, kind]);
  });

  it('tracks each phrase independently so another phrase can play immediately', () => {
    const { limiter, play, played } = voice();

    for (const kind of ['nice', 'great', 'amazing', 'wow'] as const) {
      expect(limiter.tryPlay(kind, 1000, play)).toBe(true);
      expect(limiter.tryPlay(kind, 1001, play)).toBe(false);
    }

    expect(played).toEqual(['nice', 'great', 'amazing', 'wow']);
    expect(limiter.tryPlay('great', 4000, play)).toBe(true);
    expect(limiter.tryPlay('nice', 4000, play)).toBe(false);
  });

  it('does not consume cooldown when a clip is unready and playback returns false', () => {
    const { limiter, play, played } = voice();

    expect(limiter.tryPlay('nice', 1000, () => false)).toBe(false);
    expect(limiter.tryPlay('nice', 1001, play)).toBe(true);
    expect(limiter.tryPlay('nice', 7000, play)).toBe(false);
    expect(limiter.tryPlay('nice', 7001, play)).toBe(true);
    expect(played).toEqual(['nice', 'nice']);
  });

  it('clears every phrase cooldown for a new game', () => {
    const { limiter, play } = voice();
    for (const kind of ['nice', 'great', 'amazing', 'wow'] as const) {
      expect(limiter.tryPlay(kind, 1000, play)).toBe(true);
      expect(limiter.tryPlay(kind, 1001, play)).toBe(false);
    }

    limiter.reset();

    for (const kind of ['nice', 'great', 'amazing', 'wow'] as const) {
      expect(limiter.tryPlay(kind, 1001, play)).toBe(true);
    }
  });
});
