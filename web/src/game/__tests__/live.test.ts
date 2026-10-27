import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../../api/client';
import { createGame, findHint, getSummary, trySwap, type GameState, type Timeline } from '../../engine';
import { adoptState, holdPoint, liveSubmitter, provisional, shiftTimeline } from '../live';
import { frameAt, type PlaybackBase } from '../playback';

const lineup = ['a', 'b', 'c', 'd', 'e', 'f'];
const baseOf = (s: GameState): PlaybackBase => ({ board: s.board, score: s.score, rushProgress: s.rush.progress });
const visible = (f: ReturnType<typeof frameAt>) => ({ board: f.board, phase: f.phase, clearing: [...f.clearing], score: f.score, busy: f.busy });

/** 同一棋局、同一交换：本地用自己的随机状态，「服务端」用另一个，模拟前端猜不到补落。 */
function pair(at = 1000) {
  const state = createGame({ seed: 7, lineup });
  const move = findHint(state)!;
  const local = trySwap(state, move.from, move.to, at);
  const server = trySwap({ ...state, rngState: 424242 }, move.from, move.to, at);
  if (!local.ok || !server.ok || local.timeline.kind !== 'chain') throw new Error('fixture');
  return { state, local, server };
}

describe('服务端执棋的本地播放', () => {
  it('补落开始前，本地画面与服务端结果逐帧一致', () => {
    const { state, local, server } = pair();
    const hold = holdPoint(local.timeline)!;
    expect(JSON.stringify(local.state.board)).not.toBe(JSON.stringify(server.state.board));
    for (let g = 1000; g <= hold; g += 20) {
      expect(visible(frameAt(baseOf(state), provisional(local.timeline), g))).toEqual(visible(frameAt(baseOf(state), server.timeline, g)));
    }
  });

  it('等待中的本地时间线不结束、不洗牌，只留第一批', () => {
    const { local } = pair();
    const p = provisional(local.timeline) as Extract<Timeline, { kind: 'chain' }>;
    expect(p.batches).toHaveLength(1);
    expect(p.shuffled).toBeNull();
    expect(frameAt(baseOf(createGame({ seed: 7, lineup })), p, 10 ** 9).busy).toBe(true);
  });

  it('服务端回话晚了：顺延后的时间线从停住的画面无缝接上', () => {
    const { state, local, server } = pair();
    const hold = holdPoint(local.timeline)!;
    const d = 350;
    const shifted = shiftTimeline(server.timeline, d);
    expect(visible(frameAt(baseOf(state), shifted, hold + d))).toEqual(visible(frameAt(baseOf(state), provisional(local.timeline), hold)));
    expect(shifted.busyUntil).toBe(server.timeline.busyUntil + d);
  });

  it('采用服务端棋局：画面时刻顺延，计入成绩的事实不变', () => {
    const { server } = pair();
    const adopted = adoptState(server.state, 1000, 200);
    expect(adopted.busyUntil).toBe(server.state.busyUntil + 200);
    expect(adopted.lastValidMoveAt).toBe(server.state.lastValidMoveAt);
    expect(getSummary(adopted)).toEqual(getSummary(server.state));
    expect(adoptState(server.state, 1000, 0)).toBe(server.state);
  });

  it('回弹不涉及补落，不需要停住', () => {
    const state = createGame({ seed: 7, lineup, board: ['ABCDEF', 'BCDEFA', 'CDEFAB', 'DEFABC', 'EFABCD', 'FABCDE'] });
    const bounce = trySwap(state, { r: 0, c: 0 }, { r: 0, c: 1 }, 0);
    if (!bounce.ok) throw new Error('fixture');
    expect(bounce.timeline.kind).toBe('bounce');
    expect(holdPoint(bounce.timeline)).toBeNull();
  });
});

describe('提交交换', () => {
  afterEach(() => vi.restoreAllMocks());
  const move = { at: 1, from: { r: 0, c: 0 }, to: { r: 0, c: 1 } };

  it('连不上时按间隔重试，成功即返回', async () => {
    const reply = { state: createGame({ seed: 1, lineup }), timeline: { kind: 'bounce' } } as never;
    const spy = vi.spyOn(api, 'playMove').mockRejectedValueOnce(new ApiError('unavailable')).mockResolvedValueOnce(reply);
    const waits: number[] = [];
    await expect(liveSubmitter('g', 'p', async (ms) => { waits.push(ms); })(3, move)).resolves.toBe(reply);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith('g', 'p', 3, move);
    expect(waits).toEqual([400]);
  });

  it('服务端明确拒绝不重试；一直连不上最终报错', async () => {
    const rejected = vi.spyOn(api, 'playMove').mockRejectedValue(new ApiError('invalid', 'move_late'));
    await expect(liveSubmitter('g', 'p', async () => {})(0, move)).rejects.toMatchObject({ detail: 'move_late' });
    expect(rejected).toHaveBeenCalledTimes(1);
    rejected.mockRejectedValue(new ApiError('unavailable'));
    await expect(liveSubmitter('g', 'p', async () => {})(0, move)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(rejected).toHaveBeenCalledTimes(5);
  });
});
