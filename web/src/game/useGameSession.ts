import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RULES,
  advance,
  confirmExit,
  findHint,
  getSummary,
  previewRange,
  trySwap,
  type GameState,
  type GameSummary,
  type Move,
  type Pos,
  type Timeline,
} from '../engine';
import type { RushView } from '../components/RushBar/RushBar';
import { rushView } from './rush';
import type { MessageKey } from '../i18n';
import { createGameClock, type GameClock } from './clock';
import { frameAt, type Frame, type PlaybackBase, type Popup } from './playback';
import { hintDue, loadSeenTutorials, nextTutorial, pickTip, saveSeenTutorials, type Tutorial } from './tips';

/** 系统洗牌的演示时长（墙钟）；期间两个计时器同时暂停。 */
const SHUFFLE_PAUSE_MS = 700;
const TUTORIAL_MS = 4_000;
const POPUP_MS = 800;

interface Session {
  state: GameState;
  base: PlaybackBase;
  timeline: Timeline | null;
  clock: GameClock;
  /** 最近一次有效操作的连锁结束时刻；无效交换不重置卡关提示计时。 */
  quietSince: number;
  shuffleHandled: boolean;
  shuffleResumeAt: number | null;
  tutorial: { kind: Tutorial; until: number } | null;
  seenTutorials: Set<string>;
  popups: Map<number, Popup>;
  finished: boolean;
}

export interface GameView {
  g: number;
  frame: Frame;
  timeLeftMs: number;
  rush: RushView;
  tip: MessageKey | null;
  hint: Move | null;
  popups: Popup[];
  /** 可接收新交换：已开始、未到时、棋盘稳定且不在洗牌中。 */
  acceptsInput: boolean;
  timeUp: boolean;
}

export interface UseGameSession {
  view: GameView;
  attemptSwap: (from: Pos, to: Pos) => boolean;
  preview: (from: Pos, to: Pos) => Pos[] | null;
  setDragging: (dragging: boolean) => void;
  /** 确认退出；到时后无效，返回是否作废了本局。 */
  exit: () => boolean;
  /** 开发验证用：直接读取引擎与时钟，不依赖渲染帧。 */
  peek: () => { g: number; score: number; phase: GameState['phase']; busyUntil: number; paused: boolean; rush: GameState['rush']; hint: Move | null };
}

const baseOf = (s: GameState): PlaybackBase => ({ board: s.board, score: s.score, rushProgress: s.rush.progress });

export function useGameSession(
  initial: GameState,
  onFinished: (summary: GameSummary) => void,
  { speed = 1, startAt = 0 }: { speed?: number; startAt?: number } = {},
): UseGameSession {
  const session = useRef<Session>(null as unknown as Session);
  if (!session.current) {
    session.current = {
      state: initial,
      base: baseOf(initial),
      timeline: null,
      clock: createGameClock(undefined, speed),
      quietSince: startAt,
      shuffleHandled: true,
      shuffleResumeAt: null,
      tutorial: null,
      seenTutorials: loadSeenTutorials(),
      popups: new Map(),
      finished: false,
    };
  }
  const dragging = useRef(false);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  const [, setTick] = useState(0);

  useEffect(() => {
    const s = session.current;
    s.clock.start(startAt);
    let raf = 0;
    const loop = () => {
      const now = performance.now();
      if (s.shuffleResumeAt !== null && now >= s.shuffleResumeAt) {
        // 只扣除洗牌演示本身的时长；页面在后台时晚发现的部分照常计时
        s.clock.resume(s.shuffleResumeAt);
        s.shuffleResumeAt = null;
      }
      const g = s.clock.elapsed();
      const tl = s.timeline;
      if (tl?.kind === 'chain' && tl.shuffled && !s.shuffleHandled && g >= tl.busyUntil) {
        // 两个计时器从连锁结束、开始洗牌的那一刻起暂停，不受渲染帧延迟影响
        s.shuffleHandled = true;
        s.shuffleResumeAt = s.clock.pauseAt(tl.busyUntil) + SHUFFLE_PAUSE_MS;
      }
      const { state, events } = advance(s.state, s.clock.elapsed());
      s.state = state;
      if (events.some((e) => e.type === 'finished') && !s.finished) {
        s.finished = true;
        finishedRef.current(getSummary(state));
        return;
      }
      setTick((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const s = session.current;
  const g = s.clock.elapsed();
  const frame = frameAt(s.base, s.timeline, g);
  const shuffling = s.clock.paused;
  const timeUp = g >= RULES.durationMs;
  const acceptsInput = !timeUp && !frame.busy && !shuffling && s.state.phase === 'playing';

  for (const p of frame.popups) s.popups.set(p.key, p);
  for (const [key, p] of s.popups) if (g - p.startAt >= POPUP_MS) s.popups.delete(key);

  // 带教：棋盘稳定、目标工具仍可操作时出现；同一内容只提醒一次
  if (s.tutorial && g >= s.tutorial.until) s.tutorial = null;
  if (!s.tutorial && acceptsInput) {
    const next = nextTutorial(frame.board, s.seenTutorials);
    if (next) {
      s.tutorial = { kind: next, until: g + TUTORIAL_MS };
      s.seenTutorials.add(next === 'combo' ? 'combo' : 'tool');
      saveSeenTutorials(s.seenTutorials);
    }
  }

  const hint = acceptsInput && !dragging.current && !s.tutorial && hintDue(g, s.quietSince) ? findHint(s.state) : null;

  const view: GameView = {
    g,
    frame,
    timeLeftMs: Math.max(0, RULES.durationMs - g),
    rush: rushView(s.state.rush.bonusAt, frame.rushProgress, g),
    tip: pickTip({
      finishing: timeUp && s.state.phase === 'playing',
      shuffling,
      tutorial: s.tutorial?.kind ?? null,
      hint: hint !== null,
      lastSeconds: !timeUp && RULES.durationMs - g <= 10_000,
    }),
    hint,
    popups: [...s.popups.values()],
    acceptsInput,
    timeUp,
  };

  const attemptSwap = useCallback((from: Pos, to: Pos) => {
    const cur = session.current;
    if (cur.clock.paused) return false;
    const t = cur.clock.elapsed();
    const result = trySwap(cur.state, from, to, t);
    if (!result.ok) return false;
    cur.base = baseOf(cur.state);
    cur.state = result.state;
    cur.timeline = result.timeline;
    cur.shuffleHandled = false;
    if (result.timeline.kind === 'chain') cur.quietSince = result.timeline.busyUntil;
    return true;
  }, []);

  const preview = useCallback((from: Pos, to: Pos) => previewRange(session.current.state, from, to), []);

  const setDragging = useCallback((value: boolean) => {
    dragging.current = value;
  }, []);

  const exit = useCallback(() => {
    const cur = session.current;
    const result = confirmExit(cur.state, cur.clock.elapsed());
    cur.state = result.state;
    return result.discarded;
  }, []);

  const peek = useCallback(() => {
    const cur = session.current;
    return {
      g: cur.clock.elapsed(),
      score: cur.state.score,
      phase: cur.state.phase,
      busyUntil: cur.state.busyUntil,
      paused: cur.clock.paused,
      rush: cur.state.rush,
      hint: findHint(cur.state),
    };
  }, []);

  return { view, attemptSwap, preview, setDragging, exit, peek };
}
