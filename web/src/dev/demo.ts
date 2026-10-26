/**
 * 宣传片录屏：固定种子、固定走法，在真实棋盘上按游戏时钟逐步播放（仅开发环境，?demo=<种子>）。
 * 生产构建不会包含。走法由引擎离线算出：casual 用走法种子（?play=）在有效交换里随机挑，像普通玩家一样逐步升温；
 * greedy 每步取得分最高的交换（同分取第一个）。同一组种子每次录出来都一样。
 * 录完从 window.__petMatchDemo 读取走子记录，供成片对齐手势与卡点。
 */
import { RULES, advance, getSummary, trySwap, type Effect, type GameState, type GameSummary, type Pos, type SwapResult, type ToolType } from '../engine';
import { validMoves } from '../engine/moves';
import { createRng } from '../engine/rng';
import { pickCheer, type CheerKind } from '../game/cheers';

/** 第一步前留给观众看清开局棋盘的时间（游戏时钟）。 */
export const DEMO_FIRST_MS = 1_200;
/** 每步之间的看盘间隔：上一步连消结束后多久再拖下一步。 */
export const DEMO_GAP_MS = 400;

export interface DemoMove {
  at: number;
  from: Pos;
  to: Pos;
  busyUntil: number;
  score: number;
  cheer: CheerKind | null;
  /** 本步最高计分批序（即连消倍率）。 */
  chain: number;
  effects: Effect[];
  toolsSpawned: ToolType[];
  rushBonus: boolean;
}

export type DemoStyle = 'casual' | 'greedy';

export interface DemoOptions {
  seed: number;
  style?: DemoStyle;
  /** casual 的走法种子，与棋盘种子分开，方便同一棋盘换几种打法。 */
  play?: number;
  gapMs?: number;
}

export interface DemoPlan {
  seed: number;
  style: DemoStyle;
  play: number;
  gapMs: number;
  moves: DemoMove[];
  summary: GameSummary;
}

type Accepted = Extract<SwapResult, { ok: true }>;

export function planDemo(initial: GameState, { seed, style = 'casual', play = 0, gapMs = DEMO_GAP_MS }: DemoOptions): DemoPlan {
  const rng = createRng(play);
  let state = initial;
  let t = DEMO_FIRST_MS;
  const moves: DemoMove[] = [];
  while (t < RULES.durationMs) {
    const ok = validMoves(state.board)
      .map((m) => trySwap(state, m.from, m.to, t))
      .filter((r): r is Accepted => r.ok && r.timeline.kind === 'chain');
    if (ok.length === 0) break;
    const best = style === 'greedy' ? ok.reduce((a, b) => (b.state.score > a.state.score ? b : a)) : ok[rng.int(ok.length)];
    if (best.timeline.kind !== 'chain') break;
    const tl = best.timeline;
    const scoring = tl.batches.filter((b) => b.index > 0);
    moves.push({
      at: t,
      from: tl.from,
      to: tl.to,
      busyUntil: tl.busyUntil,
      score: best.state.score - state.score,
      cheer: pickCheer(tl),
      chain: Math.max(0, ...scoring.map((b) => b.index)),
      effects: tl.batches.map((b) => b.effect),
      toolsSpawned: tl.batches.flatMap((b) => b.spawned.flatMap(({ piece }) => (piece.type === 'tool' ? [piece.tool] : []))),
      rushBonus: tl.batches.some((b) => b.rushBonus),
    });
    state = best.state;
    t = state.busyUntil + gapMs;
  }
  const done = advance(state, Math.max(RULES.durationMs, state.busyUntil)).state;
  return { seed, style, play, gapMs, moves, summary: getSummary(done) };
}

/** 分镜需要的高光各自第一次出现的游戏时刻；没出现为 null。 */
export interface DemoHighlights {
  comb: number | null;
  nice: number | null;
  great: number | null;
  amazing: number | null;
  wow: number | null;
  rushBonus: number | null;
  /** 第一步是不带喝彩的普通消除（分镜第 4 镜「拖一下就开工」）。 */
  plainOpening: boolean;
  /** Nice → Great → Amazing → Wow 依次首次出现，即分镜第 5–7 镜的逐级升温。 */
  escalates: boolean;
}

export function demoHighlights(plan: DemoPlan): DemoHighlights {
  const first = (test: (m: DemoMove) => boolean) => plan.moves.find(test)?.at ?? null;
  const cheer = (kind: CheerKind) => first((m) => m.cheer === kind);
  const order = [cheer('nice'), cheer('great'), cheer('amazing'), cheer('wow')];
  return {
    comb: first((m) => m.toolsSpawned.some((tool) => tool === 'combH' || tool === 'combV')),
    nice: order[0],
    great: order[1],
    amazing: order[2],
    wow: order[3],
    rushBonus: first((m) => m.rushBonus),
    plainOpening: plan.moves[0]?.cheer === null,
    escalates: order.every((x, i) => x !== null && (i === 0 || x > order[i - 1]!)),
  };
}

interface DemoLogEntry {
  index: number;
  /** 实际发出交换时的游戏时钟与页面时间（performance.now），用于把游戏时刻换算到录屏时间。 */
  g: number;
  wall: number;
  from: Pos;
  to: Pos;
}

interface DemoBridge {
  view: { acceptsInput: boolean; g: number };
  attemptSwap: (from: Pos, to: Pos) => boolean;
  peek: () => { score: number; phase: GameState['phase'] };
}

declare global {
  interface Window {
    __petMatchDemo?: { plan: DemoPlan; log: DemoLogEntry[]; status: 'playing' | 'done' | 'diverged'; finalScore?: number };
  }
}

/** 在棋盘页按计划逐步交换；返回停止函数。棋盘通过开发环境的 window.__petMatch 暴露。 */
export function runDemo(plan: DemoPlan): () => void {
  const record: NonNullable<Window['__petMatchDemo']> = { plan, log: [], status: 'playing' };
  window.__petMatchDemo = record;
  let next = 0;
  let raf = 0;
  const loop = () => {
    const bridge = (window as unknown as { __petMatch?: DemoBridge }).__petMatch;
    const move = plan.moves[next];
    if (bridge && move && bridge.view.acceptsInput && bridge.view.g >= move.at) {
      if (!bridge.attemptSwap(move.from, move.to)) {
        // 最后一步卡在到时边缘被拒绝时，终局比对会说明是否影响结果
        if (bridge.view.g >= RULES.durationMs - 200) {
          next = plan.moves.length;
          raf = requestAnimationFrame(loop);
          return;
        }
        record.status = 'diverged';
        console.warn(`[demo] 第 ${next + 1} 步被拒绝，演示停止`, move);
        return;
      }
      record.log.push({ index: next, g: bridge.view.g, wall: performance.now(), from: move.from, to: move.to });
      next++;
    }
    if (bridge && bridge.peek().phase !== 'playing') {
      record.finalScore = bridge.peek().score;
      record.status = record.finalScore === plan.summary.score ? 'done' : 'diverged';
      if (record.status === 'diverged') console.warn(`[demo] 终局 ${record.finalScore} 与计划 ${plan.summary.score} 不一致`);
      return;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}
