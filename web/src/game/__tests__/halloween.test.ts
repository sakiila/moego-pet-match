import { describe, expect, it } from 'vitest';
import { configuredHalloweenWindow, DEFAULT_HALLOWEEN_WINDOW, halloweenActive, halloweenPreview, nextHalloweenBoundary, parseHalloweenWindow } from '../halloween';

const window = parseHalloweenWindow('2026-10-30T00:00:00+08:00', '2026-11-02T00:00:00+08:00')!;

describe('Halloween three-day presentation window', () => {
  it('ships the first event window without requiring Docker build arguments', () => {
    expect(configuredHalloweenWindow()).toEqual(window);
    expect(DEFAULT_HALLOWEEN_WINDOW).toEqual(window);
    expect(halloweenActive(Date.parse('2026-10-28T07:00:00+08:00'))).toBe(false);
    expect(configuredHalloweenWindow('', '')).toBeNull();
    expect(configuredHalloweenWindow('2026-10-31T00:00:00+08:00')).toBeNull();
    expect(configuredHalloweenWindow(undefined, '2026-11-02T00:00:00+08:00')).toBeNull();
    const alternate = configuredHalloweenWindow('2026-10-31T00:00:00+08:00', '2026-11-03T00:00:00+08:00');
    expect(alternate!.endsAt - alternate!.startsAt).toBe(72 * 60 * 60 * 1000);
  });
  it('uses an inclusive start and exclusive end without depending on the device timezone', () => {
    expect(window.startsAt).toBe(Date.parse('2026-10-29T16:00:00Z'));
    expect(halloweenActive(window.startsAt - 1, window)).toBe(false);
    expect(halloweenActive(window.startsAt, window)).toBe(true);
    expect(halloweenActive(window.endsAt - 1, window)).toBe(true);
    expect(halloweenActive(window.endsAt, window)).toBe(false);
  });

  it('keeps the regular theme for absent, ambiguous, invalid or non-three-day configuration', () => {
    expect(parseHalloweenWindow()).toBeNull();
    expect(parseHalloweenWindow('2026-10-30T00:00:00', '2026-11-02T00:00:00')).toBeNull();
    expect(parseHalloweenWindow('invalidZ', '2026-11-02T00:00:00+08:00')).toBeNull();
    expect(parseHalloweenWindow('2026-10-30T00:00:00+08:00', '2026-11-01T00:00:00+08:00')).toBeNull();
    expect(halloweenActive(Date.now(), null)).toBe(false);
  });

  it('switches at the next scheduled boundary and stops scheduling after the event', () => {
    expect(nextHalloweenBoundary(window.startsAt - 1, window)).toBe(window.startsAt);
    expect(nextHalloweenBoundary(window.startsAt, window)).toBe(window.endsAt);
    expect(nextHalloweenBoundary(window.endsAt, window)).toBeNull();
    expect(nextHalloweenBoundary(Date.now(), null)).toBeNull();
  });

  it('ignores forced theme query parameters in production', () => {
    expect(halloweenPreview('?theme=halloween', true)).toBe(true);
    expect(halloweenPreview('?theme=default', true)).toBe(false);
    expect(halloweenPreview('?theme=halloween', false)).toBeUndefined();
    expect(halloweenPreview('?theme=fish', true)).toBeUndefined();
  });
});
