import { ApiError, api } from '../api/client';
import type { GameMove, LiveMoveResponse } from '../api/types';
import type { GameState, Timeline } from '../engine';

/**
 * 服务端执棋（正式局）：交换先在本地按当前棋盘播放，补落由服务端决定。
 * 第一批清除的画面与补落无关，本地可以先播；补落开始前若服务端还没回话，画面停在清除末尾等待，
 * 回话后把服务端时间线整体顺延等待的时长继续播放，画面不跳变。
 */
export type SubmitMove = (index: number, move: GameMove) => Promise<LiveMoveResponse>;

/** 本地先播到哪一刻为止（不含）：连消为第一批清除结算前；回弹不涉及随机，整段可播。 */
export function holdPoint(timeline: Timeline): number | null {
  return timeline.kind === 'chain' ? timeline.batches[0].settleAt - 1 : null;
}

/** 等待服务端时使用的本地时间线：只留第一批，且不结束、不洗牌，避免播出本地猜的补落与喝彩。 */
export function provisional(timeline: Timeline): Timeline {
  if (timeline.kind !== 'chain') return timeline;
  return { ...timeline, batches: [timeline.batches[0]], shuffled: null, busyUntil: Number.MAX_SAFE_INTEGER };
}

/** 服务端时间线整体顺延 d 毫秒（只影响画面节奏，成绩事实不变）。 */
export function shiftTimeline(timeline: Timeline, d: number): Timeline {
  if (d === 0) return timeline;
  if (timeline.kind === 'bounce') return { ...timeline, acceptedAt: timeline.acceptedAt + d, busyUntil: timeline.busyUntil + d };
  return {
    ...timeline,
    acceptedAt: timeline.acceptedAt + d,
    busyUntil: timeline.busyUntil + d,
    batches: timeline.batches.map((b) => ({ ...b, startAt: b.startAt + d, settleAt: b.settleAt + d })),
  };
}

/**
 * 采用服务端棋局，并把本步产生的画面时刻顺延 d：棋盘忙碌到顺延后的时间线结束，催单加分提示同步顺延。
 * lastValidMoveAt 等计入成绩的时刻保持服务端原值，结算时与服务端完全一致。
 */
export function adoptState(state: GameState, acceptedAt: number, d: number): GameState {
  if (d === 0) return state;
  const bonusAt = state.rush.bonusAt;
  return {
    ...state,
    busyUntil: state.busyUntil + d,
    rush: { ...state.rush, bonusAt: bonusAt !== null && bonusAt >= acceptedAt ? bonusAt + d : bonusAt },
  };
}

/** 连不上服务端时重试的间隔；服务端明确拒绝（成绩、时刻或顺序不符）不重试。 */
const RETRY_MS = [400, 1000, 2000];

export function liveSubmitter(gameId: string, playerId: string, wait = (ms: number) => new Promise((r) => setTimeout(r, ms))): SubmitMove {
  return async (index, move) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await api.playMove(gameId, playerId, index, move);
      } catch (error) {
        if (!(error instanceof ApiError) || error.kind !== 'unavailable' || attempt >= RETRY_MS.length) throw error;
        await wait(RETRY_MS[attempt]);
      }
    }
  };
}
