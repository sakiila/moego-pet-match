import { RULES } from '../engine';
import type { RushView } from '../components/RushBar/RushBar';

/** 成功或未赶上的结果短暂停留后收起。 */
export const RUSH_RESULT_MS = 1_500;

/**
 * 催单条显示状态：第 30 秒出现，显示服务进度与催单剩余时间；
 * 达标（结算时刻已到）即显示成功，到 50 秒仍未达标显示未赶上，随后收起。
 */
export function rushView(bonusAt: number | null, served: number, g: number): RushView {
  const { startMs, endMs } = RULES.rush;
  if (bonusAt !== null && g >= bonusAt) return g < bonusAt + RUSH_RESULT_MS ? { state: 'success' } : { state: 'hidden' };
  if (g < startMs) return { state: 'hidden' };
  if (g < endMs) return { state: 'active', served, secondsLeft: Math.ceil((endMs - g) / 1000) };
  return g < endMs + RUSH_RESULT_MS ? { state: 'expired' } : { state: 'hidden' };
}
