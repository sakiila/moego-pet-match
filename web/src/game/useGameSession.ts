import type { GameMode, GameMove } from '../api/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFeedback } from '../audio/FeedbackProvider';
import {
  PLAY,
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
import { createGameClock, type GameClock } from './clock';
import { frameAt, type Frame, type PlaybackBase, type Popup } from './playback';
import { chainStickers } from './stickers';
import { hintDue, loadSeenTutorials, nextTutorial, pickTip, saveSeenTutorials, type StickerEvent, type TipView, type Tutorial } from './tips';
import { reunionKey } from './easterEggs';
import { advanceCheer, type CheerEvent, type CheerState } from './cheers';
import { adoptState, holdPoint, provisional, shiftTimeline, type SubmitMove } from './live';

const TUTORIAL_MS = 4_000;
const POPUP_MS = 800;
/** 局内事件贴纸停留时长（游戏时钟），不暂停、不锁操作。 */
const STICKER_MS = 2_500;

interface Session {
  moves: GameMove[];
  state: GameState;
  base: PlaybackBase;
  timeline: Timeline | null;
  clock: GameClock;
  /** 最近一次有效操作的连消结束时刻；无效交换不重置卡关提示计时。 */
  quietSince: number;
  shuffleHandled: boolean;
  shuffleResumeAt: number | null;
  tutorial: { kind: Tutorial; until: number } | null;
  seenTutorials: Set<string>;
  popups: Map<number, Popup>;
  finished: boolean;
  /** 已暂记的新宠与已展示团聚的家庭（本局内）。 */
  notedNew: Set<string>;
  shownFamilies: Set<string>;
  stickers: (StickerEvent & { at: number })[];
  /** 已放过声音与触感的最大全局批序：每个清除批次在结算时刻只反馈一次。 */
  feedbackSeq: number;
  cheers: CheerState;
  /** 服务端执棋：等待服务端结算的一步；holdAt 为本地画面最多播到的时刻。 */
  pending: { index: number; holdAt: number | null } | null;
  /** 服务端执棋连不上：本局余下时间不再受理交换，已确认的成绩照常结算。 */
  offline: boolean;
}

/** 画面时刻：等待服务端时停在补落之前。 */
const visibleAt = (s: Session, g: number) => (s.pending?.holdAt != null ? Math.min(g, s.pending.holdAt) : g);

/** 局内贴纸所需的本局背景：阵容 id、未收集宠物与家庭分组。 */
export interface SessionContext {
  mode?: GameMode;
  uncollected?: ReadonlySet<string>;
  families?: Readonly<Record<string, string>>;
  /** 设置与退出弹层期间抑制喝彩，不暂停游戏。 */
  cheersEnabled?: boolean;
  /** 正式局由服务端执棋：每次交换都交给它结算补落。 */
  live?: SubmitMove;
}

export interface GameView {
  g: number;
  frame: Frame;
  timeLeftMs: number;
  rush: RushView;
  tip: TipView | null;
  hint: Move | null;
  popups: Popup[];
  cheer: CheerEvent | null;
  /** 可接收新交换：已开始、未到时、棋盘稳定且不在洗牌中。 */
  acceptsInput: boolean;
  timeUp: boolean;
  /** 服务端执棋连接中断，余下时间无法操作。 */
  offline: boolean;
}

export interface UseGameSession {
  view: GameView;
  attemptSwap: (from: Pos, to: Pos) => boolean;
  preview: (from: Pos, to: Pos) => Pos[] | null;
  setDragging: (dragging: boolean) => void;
  /** 确认退出；到时后无效，返回是否作废了本局。 */
  exit: () => boolean;
  /** 开发验证用：直接读取引擎与时钟，不依赖渲染帧。 */
  peek: () => { g: number; score: number; phase: GameState['phase']; busyUntil: number; paused: boolean; rush: GameState['rush']; hint: Move | null; served: number[]; lineup: string[] };
}

const baseOf = (s: GameState): PlaybackBase => ({ board: s.board, score: s.score, rushProgress: s.rush.progress });

export function useGameSession(
  initial: GameState,
  onFinished: (summary: GameSummary) => void,
  { speed = 1, startAt = 0, mode = 'normal', uncollected = new Set(), families = {}, cheersEnabled = true, live }: { speed?: number; startAt?: number } & SessionContext = {},
): UseGameSession {
  const session = useRef<Session>(null as unknown as Session);
  if (!session.current) {
    session.current = {
      moves: [],
      state: initial,
      base: baseOf(initial),
      timeline: null,
      clock: createGameClock(undefined, speed),
      quietSince: startAt,
      shuffleHandled: true,
      shuffleResumeAt: null,
      tutorial: null,
      seenTutorials: loadSeenTutorials(mode),
      popups: new Map(),
      finished: false,
      notedNew: new Set(),
      shownFamilies: new Set(),
      stickers: [],
      feedbackSeq: 0,
      cheers: { handledSeq: 0, active: null },
      pending: null,
      offline: false,
    };
  }
  const dragging = useRef(false);
  const uncollectedRef = useRef(uncollected);
  const familiesRef = useRef(families);
  const liveRef = useRef(live);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  const feedback = useFeedback();
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const cheersEnabledRef = useRef(cheersEnabled);
  cheersEnabledRef.current = cheersEnabled;
  const [, setTick] = useState(0);

  const syncCheer = useCallback((cur: Session, g: number) => {
    const previous = cur.cheers.active;
    cur.cheers = advanceCheer(cur.cheers, cur.timeline, g,
      cheersEnabledRef.current && document.visibilityState === 'visible' && cur.state.phase === 'playing');
    const current = cur.cheers.active;
    if (current && current.key !== previous?.key) feedbackRef.current.onCheer(current.kind);
    if (previous && !current) feedbackRef.current.stopCheer();
  }, []);

  useEffect(() => {
    if (!cheersEnabled) {
      const cur = session.current;
      cur.cheers = advanceCheer(cur.cheers, cur.timeline, cur.clock.elapsed(), false);
      feedbackRef.current.stopCheer();
    }
  }, [cheersEnabled]);

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
      const g = visibleAt(s, s.clock.elapsed());
      const tl = s.timeline;
      if (tl?.kind === 'chain' && tl.shuffled && !s.shuffleHandled && g >= tl.busyUntil) {
        // 两个计时器从连消结束、开始洗牌的那一刻起暂停，不受渲染帧延迟影响
        s.shuffleHandled = true;
        s.shuffleResumeAt = s.clock.pauseAt(tl.busyUntil) + PLAY.shufflePauseMs;
      }
      // 声音与触感：按游戏时钟，每个清除批次到结算时刻放一次（与加分飘字同一时刻）
      if (tl?.kind === 'chain') {
        for (const b of tl.batches) {
          if (b.seq > s.feedbackSeq && g >= b.settleAt) {
            s.feedbackSeq = b.seq;
            feedbackRef.current.onBatch(b);
          }
        }
      }
      // 等服务端结算的一步时不收尾：最后一步的连消要以服务端结果为准
      const { state, events } = s.pending ? { state: s.state, events: [] } : advance(s.state, s.clock.elapsed());
      s.state = state;
      if (events.some((e) => e.type === 'finished') && !s.finished) {
        s.finished = true;
        s.cheers.active = null;
        feedbackRef.current.onFinish();
        finishedRef.current({ ...getSummary(state), moves: s.moves });
        return;
      }
      syncCheer(s, visibleAt(s, s.clock.elapsed()));
      setTick((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // 计时期间切到棋盘曲，离开后由声音模块恢复局外曲（均遵循音乐开关）。
    feedbackRef.current.setMusicActive(true);
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        s.cheers = advanceCheer(s.cheers, s.timeline, s.clock.elapsed(), false);
        setTick((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      feedbackRef.current.setMusicActive(false);
    };
  }, []);

  const s = session.current;
  const g = s.clock.elapsed();
  const frame = frameAt(s.base, s.timeline, visibleAt(s, g));
  const shuffling = s.clock.paused;
  const timeUp = g >= RULES.durationMs;
  const acceptsInput = !timeUp && !frame.busy && !shuffling && s.state.phase === 'playing' && !s.pending && !s.offline;

  for (const p of frame.popups) s.popups.set(p.key, p);
  for (const [key, p] of s.popups) if (g - p.startAt >= POPUP_MS) s.popups.delete(key);

  // 带教：棋盘稳定、目标工具仍可操作时出现；同一内容只提醒一次
  if (s.tutorial && g >= s.tutorial.until) s.tutorial = null;
  if (!s.tutorial && acceptsInput) {
    const next = nextTutorial(frame.board, s.seenTutorials);
    if (next) {
      s.tutorial = { kind: next, until: g + TUTORIAL_MS };
      s.seenTutorials.add(next === 'combo' || next === 'merge' || next === 'dryer' ? next : 'tool');
      saveSeenTutorials(s.seenTutorials, mode);
    }
  }

  // 局内事件贴纸依次展示，到时后不再补播
  while (s.stickers.length && g >= s.stickers[0].at + STICKER_MS) s.stickers.shift();
  const sticker = !timeUp && s.stickers.length && g >= s.stickers[0].at ? s.stickers[0] : null;

  const hint = acceptsInput && !dragging.current && !s.tutorial && hintDue(g, s.quietSince) ? findHint(s.state) : null;

  const view: GameView = {
    g,
    frame,
    timeLeftMs: Math.max(0, RULES.durationMs - g),
    rush: rushView(s.state.rush.bonusAt, frame.rushProgress, g),
    tip: pickTip({
      finishing: timeUp && s.state.phase === 'playing',
      offline: s.offline,
      shuffling,
      event: sticker,
      tutorial: s.tutorial?.kind ?? null,
      hint: hint !== null,
      lastSeconds: !timeUp && RULES.durationMs - g <= 10_000,
    }),
    hint,
    popups: [...s.popups.values()],
    cheer: cheersEnabled && !timeUp ? s.cheers.active : null,
    acceptsInput,
    timeUp,
    offline: s.offline,
  };

  /** 采用一步的结算结果（本地或服务端），并登记卡关提示计时与局内贴纸。 */
  const apply = useCallback((cur: Session, state: GameState, timeline: Timeline) => {
    cur.state = state;
    cur.timeline = timeline;
    if (timeline.kind === 'chain') {
      cur.quietSince = timeline.busyUntil;
      const found = chainStickers(timeline, cur.state.lineup, uncollectedRef.current, familiesRef.current, cur.notedNew, cur.shownFamilies);
      const at = timeline.batches[timeline.batches.length - 1].settleAt;
      if (found.reunion) {
        cur.shownFamilies.add(found.reunion.familyId);
        cur.stickers.push({ key: reunionKey(found.reunion.pets), petIds: found.reunion.pets, at });
      }
      if (found.newPets.length) {
        found.newPets.forEach((id) => cur.notedNew.add(id));
        cur.stickers.push({ key: 'board.new_pets', vars: { count: found.newPets.length }, petIds: found.newPets, at });
      }
    }
  }, []);

  const attemptSwap = useCallback((from: Pos, to: Pos) => {
    const cur = session.current;
    if (cur.clock.paused || cur.pending || cur.offline) return false;
    const t = Math.floor(cur.clock.elapsed());
    const result = trySwap(cur.state, from, to, t);
    if (!result.ok) return false;
    const move = { at: t, from: { ...from }, to: { ...to } };
    cur.moves.push(move);
    // 两帧之间已回稳时，先收掉上一操作的反馈，再替换时间线。
    syncCheer(cur, t);
    cur.base = baseOf(cur.state);
    cur.shuffleHandled = false;
    const live = liveRef.current;
    if (!live) {
      apply(cur, result.state, result.timeline);
      return true;
    }
    // 服务端执棋：本地先播交换与第一批清除，补落等服务端；棋局在回话后才更新
    const index = cur.moves.length - 1;
    const holdAt = holdPoint(result.timeline);
    cur.pending = { index, holdAt };
    cur.timeline = provisional(result.timeline);
    live(index, move).then(
      (reply) => {
        if (cur.pending?.index !== index) return;
        const d = holdAt === null ? 0 : Math.max(0, Math.floor(cur.clock.elapsed()) - holdAt);
        cur.pending = null;
        apply(cur, adoptState(reply.state, t, d), shiftTimeline(reply.timeline, d));
      },
      () => {
        if (cur.pending?.index !== index) return;
        // 服务端没有受理这一步：退回交换前的棋盘，余下时间不再操作，已确认的成绩照常结算
        cur.pending = null;
        cur.offline = true;
        cur.moves.pop();
        cur.timeline = null;
      },
    );
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
      served: cur.state.served,
      lineup: cur.state.lineup,
    };
  }, []);

  return { view, attemptSwap, preview, setDragging, exit, peek };
}
