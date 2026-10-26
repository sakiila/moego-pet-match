import { RULES, type Timeline } from '../engine';

export type CheerKind = 'nice' | 'great' | 'amazing' | 'wow';
export const CHEER_DURATION_MS = 800;

export interface CheerEvent {
  key: number;
  kind: CheerKind;
  at: number;
}

export interface CheerState {
  handledSeq: number;
  active: CheerEvent | null;
}

/** 一次操作只选最高档；批序与视觉强度不同，首轮合体不能当作五连消。 */
export function pickCheer(timeline: Timeline): CheerKind | null {
  if (timeline.kind !== 'chain') return null;
  const batches = timeline.batches.filter((b) => !b.merge && b.index > 0 && b.cleared.length > 0);
  const chain = Math.max(0, ...batches.map((b) => b.index));
  if (batches.some((b) => b.effect === 'dryer' || b.cleared.length === b.boardAfter.length ** 2)) return 'wow';
  const cleared = batches.reduce((total, b) => total + b.cleared.length, 0);
  if (chain >= 4 || cleared >= 18) return 'amazing';
  if (chain >= 3 || batches.some((b) => b.effect === 'comboCC' || b.effect === 'comboCS')) return 'great';
  return chain >= 2 ? 'nice' : null;
}

/** 只在完整补落后发出，抑制和过期事件也消费掉，避免回到前台或关闭弹层后补播。 */
export function advanceCheer(previous: CheerState, timeline: Timeline | null, g: number, enabled = true): CheerState {
  const lastSeq = timeline?.kind === 'chain' ? (timeline.batches.at(-1)?.seq ?? 0) : 0;
  if (!enabled || g >= RULES.durationMs) return { handledSeq: Math.max(previous.handledSeq, lastSeq), active: null };
  const active = previous.active && g - previous.active.at < CHEER_DURATION_MS ? previous.active : null;
  if (timeline?.kind !== 'chain' || g < timeline.busyUntil || lastSeq <= previous.handledSeq) return { ...previous, active };
  const kind = pickCheer(timeline);
  return {
    handledSeq: lastSeq,
    active: kind && g - timeline.busyUntil < CHEER_DURATION_MS ? { key: lastSeq, kind, at: timeline.busyUntil } : active,
  };
}
