/** 30fps、120 BPM：一拍 15 帧，一小节 60 帧；10 小节 + 1 秒定格 = 630 帧。 */
export const FPS = 30;
export const BEAT = 15;
export const BAR = 60;
export const DURATION = 10 * BAR + FPS;

/** 第 bar 小节（从 1 数）第 beat 拍（从 0 数）的帧号；beat 可以是小数。 */
export const at = (bar: number, beat = 0) => Math.round((bar - 1) * BAR + beat * BEAT);

export type Cheer = 'nice' | 'great' | 'amazing' | 'wow';

/** tools/promo-video/scripts/record.mjs 写出的 timing.json，时刻均为录屏素材里的秒数。 */
export interface Timing {
  demo: number;
  play: number;
  lang: 'zh' | 'en';
  size: { width: number; height: number };
  duration: number;
  marks: { startClicked: number; report: number };
  moves: {
    index: number;
    swapAt: number;
    settledAt: number;
    from: { r: number; c: number };
    to: { r: number; c: number };
    cheer: Cheer | null;
    chain: number;
    rushBonus: boolean;
  }[];
}

export const firstCheer = (timing: Timing, cheer: Cheer) => {
  const move = timing.moves.find((m) => m.cheer === cheer);
  if (!move) throw new Error(`录屏里没有 ${cheer}`);
  return move;
};

export const rushMove = (timing: Timing) => {
  const move = timing.moves.find((m) => m.rushBonus);
  if (!move) throw new Error('录屏里没有完成催单');
  return move;
};

/** 第 7 镜快剪：催单之后 ×4 以上的大连消，按时间均匀取 count 个。 */
export const montageMoves = (timing: Timing, count = 4) => {
  const after = rushMove(timing).settledAt;
  const big = timing.moves.filter((m) => m.settledAt > after && (m.chain >= 4 || m.cheer === 'wow'));
  if (big.length < count) throw new Error(`催单之后只有 ${big.length} 次大连消`);
  return Array.from({ length: count }, (_, i) => big[Math.round((i * (big.length - 1)) / (count - 1))]);
};
