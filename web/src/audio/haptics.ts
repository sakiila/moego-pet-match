import type { HapticPattern } from '../game/feedback';

/** 震动模式（毫秒）：×1–×2 短点，×3 短双点，×4 重双点，×5 三连点。具体强度留待真机试玩调节。 */
const PATTERNS: Record<HapticPattern, number[]> = { tap: [14], double: [16, 60, 22], strong: [22, 50, 30], triple: [24, 40, 30, 40, 40] };

export const hapticsSupported = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function vibrate(pattern: HapticPattern) {
  if (hapticsSupported()) navigator.vibrate(PATTERNS[pattern]);
}

export function cancelVibration() {
  if (hapticsSupported()) navigator.vibrate(0);
}
