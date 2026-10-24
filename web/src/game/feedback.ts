import type { Batch } from '../engine';

export type SoundKind = 'pop' | 'brush' | 'snip' | 'combo';
export type HapticPattern = 'tap' | 'double' | 'strong' | 'triple';
export type ImpactKind = 'none' | 'punch' | 'shake';

export interface BatchFeedback {
  sound: SoundKind;
  /** 连锁音调级别：本次操作内的批序 − 1，逐级上扬。 */
  step: number;
  haptic: HapticPattern;
  /** 强度等级 1–5，各层反馈（定格、震屏、飘字、音效、震动、粒子）都按它分级。 */
  level: number;
}

/** 强度等级 = 批次倍率 ×1–×5；双道具合体与吹风机直接按 ×5。 */
export function batchLevel(batch: Batch): number {
  if (batch.effect === 'comboCC' || batch.effect === 'comboCS' || batch.effect === 'dryer') return 5;
  return Math.min(5, Math.max(1, batch.multiplier));
}

/** 清除定格：×3 起棋子先放大定住再炸开，占用的是既有清除时长，不延长批次。 */
const HOLD_MS = [0, 0, 0, 50, 70, 90];
export const clearHoldMs = (level: number) => HOLD_MS[Math.min(5, Math.max(0, level))];

/** 整盘震屏：×4 轻挤压，×5 挤压加横向抖动。 */
export const impactOf = (level: number): ImpactKind => (level >= 5 ? 'shake' : level === 4 ? 'punch' : 'none');

/** 震动：×1–×2 短点，×3 双点，×4 重双点，×5 三连点。 */
export const hapticFor = (level: number): HapticPattern => (level >= 5 ? 'triple' : level === 4 ? 'strong' : level === 3 ? 'double' : 'tap');

/** 泡泡粒子每格数量。 */
const PARTICLES = [3, 3, 3, 4, 5, 6];
export const particlesPerCell = (level: number) => PARTICLES[Math.min(5, Math.max(0, level))];

/** 两次反馈之间的最小间隔：同一时刻结算的多个批次只放一次，不逐格叠音叠震。 */
export const FEEDBACK_GAP_MS = 90;

/**
 * 一个清除批次对应的声音与触感（DESIGN_NOTES：普通消除「啵」、梳子「刷」、剪刀「咔嚓」、合体一个主音），
 * 震动按强度等级分级。不计分。
 */
export function batchFeedback(batch: Batch): BatchFeedback {
  const step = Math.max(0, batch.index - 1);
  const combo = batch.effect === 'comboCC' || batch.effect === 'comboCS' || batch.effect === 'dryer';
  const sound: SoundKind = combo ? 'combo' : batch.effect === 'comb' ? 'brush' : batch.effect === 'scissors' ? 'snip' : 'pop';
  const level = batchLevel(batch);
  return { sound, step, haptic: hapticFor(level), level };
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
