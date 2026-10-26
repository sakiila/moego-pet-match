import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from './theme';
import { FPS, type Timing } from './timeline';

/** 游戏同款圆体（中文子集 + Nunito），加载完才开始出帧。 */
export function Fonts() {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [
      ['nunito-latin', '200 1000', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2190-2199, U+2212, U+2215'],
      ['rounded-cjk-medium', '100 600'],
      ['rounded-cjk-bold', '601 850'],
      ['rounded-cjk-heavy', '851 1000'],
    ].map(([file, weight, range]) => new FontFace('MoeGo Rounded', `url(${staticFile(`assets/fonts/${file}.woff2`)})`, { weight, ...(range ? { unicodeRange: range } : {}) }));
    Promise.all(faces.map((f) => f.load()))
      .then((loaded) => loaded.forEach((f) => document.fonts.add(f)))
      .then(() => continueRender(handle));
  }, [handle]);
  return null;
}

/** 从 delay 帧开始的弹簧进度（0 → 1，带回弹）。 */
export function usePop(delay = 0, damping = 9) {
  const frame = useCurrentFrame();
  return spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness: 180, mass: 0.7 } });
}

const stroke = (width: number, color: string): CSSProperties => ({ WebkitTextStroke: `${width}px ${color}`, paintOrder: 'stroke fill' });

/** 贴纸感大字：白字黑描边、偏移阴影；进场弹一下。 */
export function Caption({ text, y = 150, size = 112, delay = 0, color = C.paper, edge = C.ink }: { text: string; y?: number; size?: number; delay?: number; color?: string; edge?: string }) {
  const pop = usePop(delay);
  return (
    <div
      style={{
        position: 'absolute', left: 40, right: 40, top: y, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size,
        lineHeight: 1.1, color, ...stroke(size * 0.16, edge), textShadow: `0 ${size * 0.08}px 0 ${edge}`,
        transform: `scale(${interpolate(pop, [0, 1], [0.4, 1])}) rotate(${interpolate(pop, [0, 1], [-6, -2])}deg)`, opacity: Math.min(1, pop * 3),
      }}
    >
      {text}
    </div>
  );
}

/** 喝彩字：沿用游戏里的橙字白描边，外圈墨色。 */
export function CheerWord({ word, y = 120, size = 170, delay = 0 }: { word: string; y?: number; size?: number; delay?: number }) {
  const pop = usePop(delay, 7);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', transform: `scale(${interpolate(pop, [0, 1], [0.3, 1])}) rotate(-5deg)`, opacity: Math.min(1, pop * 3) }}>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontStyle: 'italic', fontSize: size, color: C.brand, ...stroke(size * 0.2, C.paper), filter: `drop-shadow(0 10px 0 ${C.ink})` }}>{word}</span>
    </div>
  );
}

/** 宠物贴纸：从上方砸下来，压扁再回弹。 */
export function Sticker({ id, x, y, size, delay = 0, tilt = 0 }: { id: string; x: number; y: number; size: number; delay?: number; tilt?: number }) {
  const frame = useCurrentFrame();
  const fall = interpolate(frame - delay, [0, 4], [-1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const squash = spring({ frame: frame - delay - 4, fps: FPS, config: { damping: 6, stiffness: 260 } });
  const sx = frame - delay < 4 ? 1 : interpolate(squash, [0, 1], [1.35, 1]);
  const sy = frame - delay < 4 ? 1 : interpolate(squash, [0, 1], [0.7, 1]);
  if (frame < delay) return null;
  return (
    <Img
      src={staticFile(`assets/pets/${id}.png`)}
      style={{
        position: 'absolute', left: x - size / 2, top: y - size / 2 + fall * 900, width: size, height: size,
        transform: `rotate(${tilt}deg) scale(${sx}, ${sy})`, transformOrigin: '50% 100%', filter: `drop-shadow(0 14px 0 rgba(31,34,39,.25))`,
      }}
    />
  );
}

/** 四角星闪光（代替 ✨ 表情，字体里没有）。 */
export function Sparkle({ x, y, size, delay = 0, color = C.dogYellow }: { x: number; y: number; size: number; delay?: number; color?: string }) {
  const frame = useCurrentFrame();
  const pop = usePop(delay, 6);
  if (frame < delay) return null;
  return (
    <svg viewBox="-10 -10 20 20" width={size} height={size} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `scale(${pop}) rotate(${(frame - delay) * 3}deg)` }}>
      <path d="M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10Z" fill={color} stroke={C.ink} strokeWidth={1.2} />
    </svg>
  );
}

/** 录屏是 390 × 844 的手机页面；成片里按 SCALE 放大，居中偏下，上方留字幕位置。 */
export const PHONE = { width: 390, height: 844, scale: 1.75, top: 330 };
const phoneW = PHONE.width * PHONE.scale;
const phoneH = PHONE.height * PHONE.scale;

/** 圆角手机框；children 用手机页面的 CSS 像素坐标（390 × 844）。 */
export function Phone({ children, zoom = 1, zoomOrigin = '50% 50%', y = 0, shake = 0 }: { children: ReactNode; zoom?: number; zoomOrigin?: string; y?: number; shake?: number }) {
  const frame = useCurrentFrame();
  const dx = shake ? Math.sin(frame * 2.7) * shake : 0;
  const dy = shake ? Math.cos(frame * 3.3) * shake : 0;
  return (
    <div
      style={{
        position: 'absolute', left: (1080 - phoneW) / 2 + dx, top: PHONE.top + y + dy, width: phoneW, height: phoneH, borderRadius: 64, overflow: 'hidden',
        border: `10px solid ${C.ink}`, boxShadow: `0 22px 0 ${C.ink}`, background: C.paper, boxSizing: 'content-box', marginLeft: -10, marginTop: -10,
      }}
    >
      <div style={{ width: PHONE.width, height: PHONE.height, transform: `scale(${PHONE.scale})`, transformOrigin: '0 0', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: zoomOrigin }}>{children}</div>
      </div>
    </div>
  );
}

/** 棋盘格中心（手机 CSS 像素），按 390 × 844 录屏实测。 */
const cell = ({ r, c }: { r: number; c: number }) => ({ x: 38 + 52.2 * c, y: 363 + 52.2 * r });

/**
 * 一段录屏：把素材时刻 anchor 对到成片第 at 帧，按 rate 倍速播放，只占 [from, to) 帧。
 * 同时画出这一段里每一步的拖动手势。
 */
export function Clip({ timing, src, from, to, anchor, at: anchorFrame, rate = 1 }: { timing: Timing; src: string; from: number; to: number; anchor: number; at: number; rate?: number }) {
  const start = anchor - ((anchorFrame - from) / FPS) * rate;
  const end = start + ((to - from) / FPS) * rate;
  const toFrame = (t: number) => (t - start) / rate * FPS;
  const moves = timing.moves.filter((m) => m.swapAt > start && m.swapAt - 0.35 < end);
  return (
    <Sequence from={from} durationInFrames={to - from} layout="none">
      <AbsoluteFill>
        <OffthreadVideo src={src} trimBefore={Math.max(0, Math.round(start * FPS))} playbackRate={rate} muted style={{ width: PHONE.width, height: PHONE.height }} />
        {moves.map((m) => <Finger key={m.index} from={cell(m.from)} to={cell(m.to)} swapFrame={toFrame(m.swapAt)} rate={rate} />)}
      </AbsoluteFill>
    </Sequence>
  );
}

/** 拖动手势：交换发出前 0.3 秒按下，滑到相邻格，松手淡出。 */
function Finger({ from, to, swapFrame, rate }: { from: { x: number; y: number }; to: { x: number; y: number }; swapFrame: number; rate: number }) {
  const frame = useCurrentFrame();
  const lead = (0.3 * FPS) / rate;
  const p = interpolate(frame, [swapFrame - lead, swapFrame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fade = interpolate(frame, [swapFrame - lead - 3, swapFrame - lead, swapFrame + 2, swapFrame + 8], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (fade <= 0) return null;
  const x = from.x + (to.x - from.x) * p;
  const y = from.y + (to.y - from.y) * p;
  return (
    <div style={{ position: 'absolute', left: x - 17, top: y - 17, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.55)', border: `3px solid ${C.ink}`, opacity: fade, boxShadow: '0 3px 0 rgba(31,34,39,.35)' }} />
  );
}

/** 背景：品牌橙或浅橙，带斜向圆点纹理。 */
export function Backdrop({ tone }: { tone: 'brand' | 'soft' }) {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const bg = tone === 'brand' ? C.brand : C.brandSoft;
  const dot = tone === 'brand' ? 'rgba(255,255,255,.14)' : 'rgba(249,107,28,.12)';
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: -120, width: width + 240, height: height + 240, backgroundImage: `radial-gradient(${dot} 14px, transparent 15px)`, backgroundSize: '80px 80px', transform: `translate(${(frame * 1.2) % 80}px, ${(frame * 1.2) % 80}px)` }} />
    </AbsoluteFill>
  );
}
