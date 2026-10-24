import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { batchFeedback, createLimiter, FEEDBACK_GAP_MS } from '../game/feedback';
import { loadPreferences, savePreferences, type SoundPreferences } from '../game/preferences';
import type { Batch } from '../engine';
import { cancelVibration, hapticsSupported, vibrate } from './haptics';
import { playFinish, playPrinted, playSound, playStamp, startMusic, stopMusic, suspendAudio, unlockAudio } from './sound';

interface Feedback {
  prefs: SoundPreferences;
  hapticsAvailable: boolean;
  setPref: (key: keyof SoundPreferences, on: boolean) => void;
  /** 一个清除批次结算时调用；按开关与限频播放音效和轻震。 */
  onBatch: (batch: Batch) => void;
  onFinish: () => void;
  /** 报告小票送到位（「叮」+ 轻震）与印章拍下（「咚」+ 短双点）。 */
  onPrinted: () => void;
  onStamp: () => void;
  /** 棋盘计时期间为 true：只有这时（且音乐开关打开）播放背景音乐。 */
  setMusicActive: (active: boolean) => void;
}

const FeedbackContext = createContext<Feedback | null>(null);

const storage = () => {
  try {
    return localStorage;
  } catch {
    return null;
  }
};

/** 开发验证用：记录实际触发的声音与触感（无头浏览器听不到声音）。生产环境不记录。 */
const record = (event: string) => {
  if (import.meta.env.DEV) ((window as unknown as { __feedbackLog?: string[] }).__feedbackLog ??= []).push(event);
};

/**
 * 声音与触感：偏好放在一处，门店设置与棋盘设置共用；页面隐藏时停止声音与震动，回来后按开关恢复。
 * 音乐与音效首次静音，支持震动的设备轻震首次开启。
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const available = hapticsSupported();
  const [prefs, setPrefs] = useState(() => loadPreferences(storage(), available));
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const musicActive = useRef(false);
  const allow = useRef(createLimiter(FEEDBACK_GAP_MS));

  const syncMusic = useCallback(() => {
    if (musicActive.current && prefsRef.current.music && document.visibilityState === 'visible') {
      unlockAudio();
      startMusic();
      record('music:start');
    } else {
      stopMusic();
    }
  }, []);

  const setPref = useCallback(
    (key: keyof SoundPreferences, on: boolean) => {
      const next = { ...prefsRef.current, [key]: on && (key !== 'haptics' || available) };
      prefsRef.current = next;
      setPrefs(next);
      savePreferences(storage(), next);
      // 拨动开关本身就是用户操作，可以解除浏览器的自动播放限制
      if (on && key !== 'haptics') unlockAudio();
      if (key === 'music') syncMusic();
    },
    [available, syncMusic],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopMusic();
        suspendAudio();
        cancelVibration();
        record('hidden:stop');
      } else {
        if (prefsRef.current.sfx || prefsRef.current.music) unlockAudio();
        syncMusic();
      }
    };
    // 浏览器（尤其 iOS Safari）只允许在用户操作中启动声音：任意一次按下都顺手解锁
    const onGesture = () => {
      if (prefsRef.current.sfx || prefsRef.current.music) unlockAudio();
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('pointerdown', onGesture, { capture: true });
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('pointerdown', onGesture, { capture: true });
    };
  }, [syncMusic]);

  const value = useMemo<Feedback>(
    () => ({
      prefs,
      hapticsAvailable: available,
      setPref,
      onBatch: (batch) => {
        if (!allow.current(performance.now())) return;
        const f = batchFeedback(batch);
        const p = prefsRef.current;
        if (p.sfx) playSound(f.sound, f.step, f.level);
        if (p.haptics) vibrate(f.haptic);
        record(`batch:${f.sound}:${f.step}:L${f.level}:${p.sfx ? 'sfx' : '-'}:${p.haptics ? f.haptic : '-'}`);
      },
      onFinish: () => {
        if (prefsRef.current.sfx) playFinish();
        stopMusic();
        record(`finish:${prefsRef.current.sfx ? 'sfx' : '-'}`);
      },
      onPrinted: () => {
        const p = prefsRef.current;
        if (p.sfx) playPrinted();
        if (p.haptics) vibrate('tap');
        record(`printed:${p.sfx ? 'sfx' : '-'}:${p.haptics ? 'tap' : '-'}`);
      },
      onStamp: () => {
        const p = prefsRef.current;
        if (p.sfx) playStamp();
        if (p.haptics) vibrate('double');
        record(`stamp:${p.sfx ? 'sfx' : '-'}:${p.haptics ? 'double' : '-'}`);
      },
      setMusicActive: (active) => {
        musicActive.current = active;
        if (active) unlockAudio();
        syncMusic();
      },
    }),
    [prefs, available, setPref, syncMusic],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

/** 没有 Provider 时（陈列页单独渲染组件）返回静默实现。 */
const SILENT: Feedback = {
  prefs: { music: false, sfx: false, haptics: false },
  hapticsAvailable: false,
  setPref: () => {},
  onBatch: () => {},
  onFinish: () => {},
  onPrinted: () => {},
  onStamp: () => {},
  setMusicActive: () => {},
};

export const useFeedback = () => useContext(FeedbackContext) ?? SILENT;
