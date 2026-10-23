import type { SoundKind } from '../game/feedback';

/**
 * 现场合成的音效与背景音乐（WebAudio），不需要音频文件。总音量很低；
 * 浏览器没有 WebAudio 时全部静默跳过。AudioContext 在第一次用户操作时创建 / 恢复（自动播放限制）。
 * 日后有正式素材时，只替换这里的播放源。
 */
const MASTER = 0.22;
const MUSIC_LEVEL = 0.18;
/** 五声音阶（C 大调宫调式），连锁音调逐级上扬也取这里的音。 */
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (ctx && master) return { ctx, out: master };
  const Ctor = typeof window === 'undefined' ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = MASTER;
  master.connect(ctx.destination);
  return { ctx, out: master };
}

/** 在用户操作（点击「开始这班」、拨动开关）时调用，解除自动播放限制。 */
export function unlockAudio() {
  const a = audio();
  if (a && a.ctx.state === 'suspended') void a.ctx.resume();
}

/** 页面隐藏时暂停全部声音；回来后由调用方按开关恢复。 */
export function suspendAudio() {
  if (ctx && ctx.state === 'running') void ctx.suspend();
}

function tone(a: { ctx: AudioContext; out: AudioNode }, freq: number, at: number, dur: number, type: OscillatorType, peak: number, slideTo?: number) {
  const o = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(a.out);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function noise(a: { ctx: AudioContext; out: AudioNode }, at: number, dur: number, peak: number, filter: { type: BiquadFilterType; from: number; to: number; q?: number }) {
  const len = Math.ceil(a.ctx.sampleRate * dur);
  const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  const f = a.ctx.createBiquadFilter();
  f.type = filter.type;
  f.Q.value = filter.q ?? 1;
  f.frequency.setValueAtTime(filter.from, at);
  f.frequency.exponentialRampToValueAtTime(filter.to, at + dur);
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(a.out);
  src.start(at);
}

/** 播放一个批次的音效；step 为连锁级别（逐级上扬）。 */
export function playSound(kind: SoundKind, step = 0) {
  const a = audio();
  if (!a || a.ctx.state !== 'running') return;
  const t = a.ctx.currentTime;
  const note = PENTA[Math.min(step, PENTA.length - 1)];
  if (kind === 'pop') {
    // 「啵」：短促上滑的正弦泡泡
    tone(a, note, t, 0.11, 'sine', 0.9, note * 1.5);
  } else if (kind === 'brush') {
    // 「刷」：带通噪声由低扫到高
    noise(a, t, 0.22, 0.7, { type: 'bandpass', from: 900, to: 4200, q: 1.4 });
    tone(a, note, t + 0.02, 0.1, 'triangle', 0.35);
  } else if (kind === 'snip') {
    // 「咔嚓」：两下高通噪声短击
    noise(a, t, 0.05, 0.9, { type: 'highpass', from: 3000, to: 6000 });
    noise(a, t + 0.07, 0.06, 0.8, { type: 'highpass', from: 2600, to: 5200 });
  } else {
    // 合体：一个主音（上扬的三和弦琶音），不逐格叠音
    [0, 2, 4].forEach((i, k) => tone(a, PENTA[Math.min(step + i, PENTA.length - 1)], t + k * 0.05, 0.28, 'triangle', 0.6));
  }
}

/** 局终收尾音：短促的下行两音。 */
export function playFinish() {
  const a = audio();
  if (!a || a.ctx.state !== 'running') return;
  const t = a.ctx.currentTime;
  tone(a, PENTA[5], t, 0.18, 'triangle', 0.6);
  tone(a, PENTA[2], t + 0.16, 0.36, 'triangle', 0.6);
}

/** 小票送到位的「叮」：高音钟声（基音加一个不谐和的泛音，衰减稍长）。 */
export function playPrinted() {
  const a = audio();
  if (!a || a.ctx.state !== 'running') return;
  const t = a.ctx.currentTime;
  tone(a, PENTA[7], t, 0.9, 'sine', 0.7);
  tone(a, PENTA[7] * 2.4, t, 0.45, 'sine', 0.22);
}

/** 印章拍下：低沉的「咚」加一点纸面拍击声。 */
export function playStamp() {
  const a = audio();
  if (!a || a.ctx.state !== 'running') return;
  const t = a.ctx.currentTime;
  tone(a, 150, t, 0.24, 'sine', 1, 55);
  noise(a, t, 0.07, 0.5, { type: 'lowpass', from: 1800, to: 300 });
}

// ---------- 背景音乐：低音量五声音阶循环（占位，日后替换为正式音乐文件） ----------

/** 两小节旋律（八分音符，音阶下标；-1 为休止）与对应的低音根音。 */
const MELODY = [0, 2, 4, 2, 3, 4, 2, -1, 4, 3, 2, 0, 1, 2, 0, -1];
const BASS = [130.81, 130.81, 174.61, 196];
const EIGHTH = 60 / 112 / 2;

let musicGain: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let nextAt = 0;
let stepIndex = 0;

export function startMusic() {
  const a = audio();
  if (!a || timer) return;
  musicGain = a.ctx.createGain();
  musicGain.gain.value = MUSIC_LEVEL;
  musicGain.connect(a.out);
  nextAt = a.ctx.currentTime + 0.1;
  stepIndex = 0;
  // 提前 0.3 秒排好音符，计时器抖动不影响节奏
  const schedule = () => {
    if (!musicGain) return;
    while (nextAt < a.ctx.currentTime + 0.3) {
      const m = MELODY[stepIndex % MELODY.length];
      const out = { ctx: a.ctx, out: musicGain };
      if (m >= 0) tone(out, PENTA[m], nextAt, EIGHTH * 0.9, 'triangle', 0.5);
      if (stepIndex % 4 === 0) tone(out, BASS[(stepIndex / 4) % BASS.length], nextAt, EIGHTH * 3.6, 'sine', 0.55);
      nextAt += EIGHTH;
      stepIndex++;
    }
  };
  schedule();
  timer = setInterval(schedule, 100);
}

export function stopMusic() {
  if (timer) clearInterval(timer);
  timer = null;
  if (musicGain && ctx) {
    const g = musicGain;
    g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
    setTimeout(() => g.disconnect(), 400);
  }
  musicGain = null;
}
