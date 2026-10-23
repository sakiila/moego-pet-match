import type { Batch } from '../engine';

export type SoundKind = 'pop' | 'brush' | 'snip' | 'combo';
export type HapticPattern = 'tap' | 'double';

export interface BatchFeedback {
  sound: SoundKind;
  /** 连锁音调级别：本次操作内的批序 − 1，逐级上扬。 */
  step: number;
  haptic: HapticPattern;
}

/** 两次反馈之间的最小间隔：同一时刻结算的多个批次只放一次，不逐格叠音叠震。 */
export const FEEDBACK_GAP_MS = 90;

/**
 * 一个清除批次对应的声音与触感（DESIGN_NOTES：普通消除「啵」、梳子「刷」、剪刀「咔嚓」、合体一个主音；
 * 普通批次一次短点，强合体与较强连锁用短双点）。不计分。
 */
export function batchFeedback(batch: Batch): BatchFeedback {
  const step = Math.max(0, batch.index - 1);
  const combo = batch.effect === 'comboCC' || batch.effect === 'comboCS' || batch.effect === 'comboSS';
  const sound: SoundKind = combo ? 'combo' : batch.effect === 'comb' ? 'brush' : batch.effect === 'scissors' ? 'snip' : 'pop';
  return { sound, step, haptic: combo || batch.index >= 3 ? 'double' : 'tap' };
}

/** 返回一个按时间限频的判定：距上次放行不足 gap 毫秒时拒绝。 */
export function createLimiter(gapMs: number) {
  let last = -Infinity;
  return (now: number) => {
    if (now - last < gapMs) return false;
    last = now;
    return true;
  };
}
