import type { HapticPattern } from '../game/feedback';

/** 震动模式（毫秒）：普通批次一次短点；强合体与较强连锁一个短双点。具体强度留待真机试玩调节。 */
const PATTERNS: Record<HapticPattern, number[]> = { tap: [14], double: [16, 60, 22] };

export const hapticsSupported = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function vibrate(pattern: HapticPattern) {
  if (hapticsSupported()) navigator.vibrate(PATTERNS[pattern]);
}

export function cancelVibration() {
  if (hapticsSupported()) navigator.vibrate(0);
}
