import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COPY, type Lang } from './copy';
import { Backdrop, Caption, CheerWord, Clip, Fonts, Phone, Sparkle, Sticker, usePop } from './parts';
import { PETS } from './pets.js';
import { C, FONT } from './theme';
import { BAR, BEAT, at, firstCheer, montageMoves, rushMove, type Cheer, type Timing } from './timeline';

export type PromoProps = {
  lang: Lang;
  /** 由 Root 的 calculateMetadata 从 public/recordings/<demo>-<play>-<lang>/timing.json 读入。 */
  timing?: Timing;
  recording: string;
};

const WORDS: Record<Cheer, string> = { nice: 'Nice!', great: 'Great!', amazing: 'Amazing!', wow: 'Wow!' };

/** 中段每半小节一个高光：喝彩、+1000 都落在拍点上（第 4–6 小节）。 */
const HIT = { drag: at(4, 1), nice: at(4, 3), great: at(5, 1), amazing: at(5, 3), wow: at(6, 1), rush: at(6, 3) };

/** 分镜见 design/reviews/2026-10-26-promo-video/STORYBOARD.md；镜头编号与表格一致。 */
export function Promo({ lang, timing, recording }: PromoProps) {
  if (!timing) return null;
  const t = COPY[lang];
  const src = staticFile(`${recording}/game.mp4`);
  const clip = { timing, src };
  const nice = firstCheer(timing, 'nice');
  const great = firstCheer(timing, 'great');
  const amazing = firstCheer(timing, 'amazing');
  const wow = firstCheer(timing, 'wow');
  const rush = rushMove(timing);
  const montage = montageMoves(timing);
  const report = timing.marks.report;

  return (
    <AbsoluteFill style={{ background: C.brand, fontFamily: FONT }}>
      <Fonts />

      {/* 1–3：贴纸砸场、口号前半、标题 */}
      <Sequence durationInFrames={at(4)}>
        <Backdrop tone="brand" />
      </Sequence>
      <Sequence durationInFrames={BAR}>
        {[[290, 820, -8], [800, 760, 7], [300, 1330, 6], [790, 1380, -7]].map(([x, y, tilt], i) => (
          <Sticker key={i} id={PETS[i]} x={x} y={y} size={430} tilt={tilt} delay={i * BEAT} />
        ))}
        <Caption text={t.home} y={190} size={lang === 'zh' ? 180 : 110} />
      </Sequence>
      <Sequence from={at(2)} durationInFrames={BAR}>
        <MatchRow />
        <Caption text={t.star} y={190} size={lang === 'zh' ? 180 : 110} />
        <Sparkle x={150} y={170} size={110} delay={BEAT * 2} />
        <Sparkle x={940} y={420} size={90} delay={BEAT * 2 + 3} color={C.paper} />
        <Sparkle x={880} y={140} size={70} delay={BEAT * 3} />
      </Sequence>
      <Sequence from={at(3)} durationInFrames={BAR}>
        <TitleCard title={t.title} subtitle={t.subtitle} />
      </Sequence>

      {/* 4–8：手机里的真机录屏 */}
      <Sequence from={at(3, 3)} durationInFrames={at(9) - at(3, 3)}>
        <PhoneScenes {...{ lang, timing, clip, nice, great, amazing, wow, rush, montage, report }} />
      </Sequence>

      {/* 9：副歌回归 */}
      <Sequence from={at(9)} durationInFrames={BAR}>
        <Backdrop tone="brand" />
        {(['nice', 'great', 'amazing', 'wow'] as Cheer[]).map((cheer, i) => (
          <Sequence key={cheer} from={i * BEAT} durationInFrames={BEAT}>
            <Sticker id={PETS[4 + i]} x={540} y={980} size={680} tilt={i % 2 ? 6 : -6} />
            <CheerWord word={WORDS[cheer]} y={1380} size={190} />
          </Sequence>
        ))}
      </Sequence>

      {/* 10：口号完整 + 入口 */}
      <Sequence from={at(10)}>
        <Finale lang={lang} />
      </Sequence>

      <Soundtrack />
    </AbsoluteFill>
  );
}

/** 2：四只贴纸排一行，前三只「三消」弹飞。 */
function MatchRow() {
  const frame = useCurrentFrame();
  const burst = interpolate(frame, [BEAT * 2, BEAT * 2 + 4, BEAT * 2 + 9], [1, 1.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const enter = usePop(0, 10);
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const x = 165 + i * 250;
        const s = i < 3 ? burst : 1;
        return (
          <div key={i} style={{ position: 'absolute', left: x - 120, top: 1000 - 120, width: 240, height: 240, transform: `scale(${s * enter})` }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 40, background: C.paper, border: `6px solid ${C.ink}` }} />
            <Img src={staticFile(`assets/pets/${PETS[i]}.png`)} style={{ position: 'absolute', inset: 14, width: 200, height: 200 }} />
          </div>
        );
      })}
      {[0, 1, 2].map((i) => <Sparkle key={i} x={165 + i * 250} y={1000} size={150} delay={BEAT * 2 + 5} color={C.paper} />)}
    </>
  );
}

/** 3：Logo、游戏名与一句话卖点。 */
function TitleCard({ title, subtitle }: { title: string; subtitle: string }) {
  const logo = usePop(0, 10);
  const pill = usePop(8, 10);
  return (
    <>
      <div style={{ position: 'absolute', left: 290, top: 420, width: 500, height: 170, borderRadius: 999, background: C.paper, border: `8px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${logo}) rotate(-3deg)` }}>
        <Img src={staticFile('assets/moego-logo.png')} style={{ height: 100 }} />
      </div>
      <Caption text={title} y={680} size={150} delay={4} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', transform: `scale(${pill})` }}>
        <span style={{ display: 'inline-block', padding: '18px 48px', borderRadius: 999, background: C.ink, color: C.paper, fontWeight: 900, fontSize: 72 }}>{subtitle}</span>
      </div>
    </>
  );
}

type Move = Timing['moves'][number];
interface PhoneScenesProps {
  lang: Lang;
  timing: Timing;
  clip: { timing: Timing; src: string };
  nice: Move;
  great: Move;
  amazing: Move;
  wow: Move;
  rush: Move;
  montage: Move[];
  /** 录屏脚本记录的报告页时刻（按钮可点时，比转场晚约 0.5 秒）；收工挂牌在它之前。成片不放结算页。 */
  report: number;
}

/** 4–8 镜。帧号相对本 Sequence（从第 3 小节第 4 拍开始，手机先滑进来）。录屏统一 1.5 倍速，只留每个高光前后各 0.75 秒。 */
function PhoneScenes({ lang, timing, clip, nice, great, amazing, wow, rush, montage, report }: PhoneScenesProps) {
  const frame = useCurrentFrame();
  const t = COPY[lang];
  const o = at(3, 3); // 本 Sequence 的起点
  const f = (absolute: number) => absolute - o;
  const slide = interpolate(frame, [0, BEAT], [1400, 0], { extrapolateRight: 'clamp', easing: (x) => 1 - (1 - x) ** 3 });
  const punch = (hit: number) => interpolate(frame - f(hit), [0, 3, 12], [1, 1.05, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zoom = punch(HIT.nice) * punch(HIT.great) * punch(HIT.amazing) * punch(HIT.wow);
  const shake = interpolate(frame - f(HIT.wow), [0, 2, 14], [0, 16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const flash = interpolate(frame - f(HIT.wow), [0, 1, 8], [0, 0.85, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const small = lang === 'zh' ? 96 : 76;

  return (
    <>
      <Backdrop tone="soft" />
      <Phone y={slide} shake={shake} zoom={zoom} zoomOrigin="50% 62%">
        <Clip {...clip} from={0} to={f(at(4, 2))} anchor={timing.moves[0].settledAt} at={f(HIT.drag)} rate={1.5} />
        <Clip {...clip} from={f(at(4, 2))} to={f(at(5))} anchor={nice.settledAt} at={f(HIT.nice)} rate={1.5} />
        <Clip {...clip} from={f(at(5))} to={f(at(5, 2))} anchor={great.settledAt} at={f(HIT.great)} rate={1.5} />
        <Clip {...clip} from={f(at(5, 2))} to={f(at(6))} anchor={amazing.settledAt} at={f(HIT.amazing)} rate={1.5} />
        <Clip {...clip} from={f(at(6))} to={f(at(6, 2))} anchor={wow.settledAt} at={f(HIT.wow)} rate={1.5} />
        <Clip {...clip} from={f(at(6, 2))} to={f(at(7))} anchor={rush.settledAt} at={f(HIT.rush)} rate={1.5} />
        {montage.map((m, i) => (
          <Clip key={m.index} {...clip} from={f(at(7, i))} to={f(at(7, i + 1))} anchor={m.settledAt} at={f(at(7, i)) + 9} rate={1.5} />
        ))}
        {/* 收工挂牌约在报告页标记前 1.55 秒落下、停留约 1 秒后转场：让它落在第 3 拍，转场前收住，不进结算页 */}
        <Clip {...clip} from={f(at(8))} to={f(at(9))} anchor={report - 1.55} at={f(at(8, 2))} />
      </Phone>
      <AbsoluteFill style={{ background: C.paper, opacity: flash, pointerEvents: 'none' }} />

      <Sequence from={f(at(4))} durationInFrames={BEAT * 3}><Caption text={t.drag} y={95} size={small} /></Sequence>
      <Sequence from={f(HIT.nice)} durationInFrames={BEAT * 2}><CheerWord word="Nice!" y={40} size={190} /></Sequence>
      <Sequence from={f(HIT.great)} durationInFrames={BEAT * 2}><CheerWord word="Great!" y={40} size={190} /></Sequence>
      <Sequence from={f(HIT.amazing)} durationInFrames={BEAT * 2}>
        <CheerWord word="Amazing!" y={10} size={150} />
        <Caption text={t.max} y={208} size={60} />
      </Sequence>
      <Sequence from={f(HIT.wow)} durationInFrames={BEAT * 2}>
        <CheerWord word="Wow!" y={20} size={200} />
        <Caption text={t.dryer} y={235} size={lang === 'zh' ? 64 : 48} />
      </Sequence>
      <Sequence from={f(HIT.rush)} durationInFrames={BEAT}><Caption text={t.rush} y={95} size={small} /></Sequence>
      <Sequence from={f(at(7))} durationInFrames={BAR}><Caption text={t.nonstop} y={95} size={small} /></Sequence>
      <Sequence from={f(at(8))} durationInFrames={BAR}><Caption text={t.report} y={95} size={lang === 'zh' ? 88 : 70} /></Sequence>
    </>
  );
}

/** 10：完整口号、入口地址与 Logo。 */
function Finale({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const url = usePop(BEAT * 2, 9);
  const size = lang === 'zh' ? 170 : 104;
  return (
    <>
      <Backdrop tone="brand" />
      <Caption text={t.tagline[0]} y={360} size={size} />
      <Caption text={t.tagline[1]} y={360 + size * 1.25} size={size} delay={BEAT} />
      <Sparkle x={150} y={330} size={120} delay={BEAT} />
      <Sparkle x={940} y={600 + size * 0.6} size={100} delay={BEAT + 4} color={C.paper} />
      {[0, 1, 2, 3].map((i) => <Sticker key={i} id={PETS[(i * 2 + 1) % 8]} x={170 + i * 247} y={1120} size={230} tilt={i % 2 ? 8 : -8} delay={BEAT + i * 3} />)}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1400, textAlign: 'center', transform: `scale(${url})` }}>
        <span style={{ display: 'inline-block', padding: '22px 60px', borderRadius: 999, background: C.paper, border: `8px solid ${C.ink}`, boxShadow: `0 12px 0 ${C.ink}`, color: C.ink, fontWeight: 900, fontSize: 84 }}>{t.url}</span>
      </div>
      <Img src={staticFile('assets/moego-logo.png')} style={{ position: 'absolute', left: 390, top: 1720, width: 300, filter: 'brightness(0) invert(1)' }} />
    </>
  );
}

/** 原创节拍 + 自录喝彩 + 合成音效，全部卡在拍点上。 */
function Soundtrack() {
  const voice = (word: Cheer, frame: number, key: string) => (
    <Sequence key={key} from={frame - 1} layout="none"><Audio src={staticFile(`assets/cheers/${word}.mp3`)} volume={1} /></Sequence>
  );
  const sfx = (name: string, frame: number, volume = 0.6) => (
    <Sequence key={`${name}-${frame}`} from={frame} layout="none"><Audio src={staticFile(`assets/sfx/${name}.wav`)} volume={volume} /></Sequence>
  );
  const cheers: Cheer[] = ['nice', 'great', 'amazing', 'wow'];
  return (
    <>
      <Audio src={staticFile('assets/beat.mp3')} volume={0.8} />
      {sfx('pop', at(2, 2), 0.7)}
      {sfx('whoosh', at(3, 3), 0.5)}
      {sfx('pop', HIT.drag, 0.5)}
      {cheers.map((w) => voice(w, HIT[w], `scene-${w}`))}
      {sfx('crash', HIT.wow, 0.5)}
      {sfx('ding', HIT.rush, 0.6)}
      {[0, 1, 2, 3].map((i) => sfx('pop', at(7, i) + 9, 0.55))}
      {sfx('slam', at(8, 2), 0.6)}
      {cheers.map((w, i) => voice(w, at(9, i), `chorus-${w}`))}
      {voice('wow', at(10), 'finale')}
      {sfx('crash', at(10), 0.4)}
    </>
  );
}
