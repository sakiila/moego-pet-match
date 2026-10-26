import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion';
import { COPY, type Lang } from './copy';
import { Backdrop, Caption, Fonts, Phone, PHONE, Sparkle, Sticker } from './parts';
import { PETS } from './pets.js';
import { C, FONT } from './theme';
import { FPS, firstCheer, type Timing } from './timeline';

/** 进场动画都用负的 delay，让封面这一帧里所有元素已经落定。 */
const SETTLED = -60;

/**
 * 封面：口号 + 斜放的手机（录屏里「×5 顶格！」那一帧）+ 四只宠物 + 入口。
 * 既单独导出成图片，也作为成片开头 0.5 秒的定格，让 Slack / 微信取首帧当缩略图时显示它。
 */
export function Cover({ lang, timing, recording }: { lang: Lang; timing: Timing; recording: string }) {
  const t = COPY[lang];
  // Amazing 那一步连消结束后约 0.1 秒，飘字「×5 顶格！」正好完整出现
  const still = Math.round((firstCheer(timing, 'amazing').settledAt + 0.1) * FPS);
  const tagline = lang === 'zh' ? 150 : 96;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Fonts />
      <Backdrop tone="brand" />
      <div style={{ position: 'absolute', left: 340, top: 70, width: 400, height: 130, borderRadius: 999, background: C.paper, border: `7px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-3deg)' }}>
        <Img src={staticFile('assets/moego-logo.png')} style={{ height: 76 }} />
      </div>
      <Caption text={t.tagline[0]} y={240} size={tagline} delay={SETTLED} />
      <Caption text={t.tagline[1]} y={240 + tagline * 1.2} size={tagline} delay={SETTLED} />
      <Sparkle x={110} y={250} size={110} delay={SETTLED} />
      <Sparkle x={975} y={430} size={90} delay={SETTLED} color={C.paper} />

      {/* 手机缩小斜放在口号与底部信息之间（约 y 650–1540）；Phone 自身按整幅画面定位，外层整体缩放 */}
      <AbsoluteFill style={{ transform: 'translateY(145px) scale(0.6) rotate(-5deg)', transformOrigin: '50% 40%' }}>
        <Phone>
          {/* 素材起点直接设到 still；封面在成片开头时由外层 Freeze 固定在第 0 帧，录屏就停在这一帧 */}
          <OffthreadVideo src={staticFile(`${recording}/game.mp4`)} trimBefore={still} muted style={{ width: PHONE.width, height: PHONE.height }} />
        </Phone>
      </AbsoluteFill>
      {[[150, 880, -10, 300], [935, 820, 9, 280], [170, 1450, 8, 280], [925, 1400, -8, 300]].map(([x, y, tilt, size], i) => (
        <Sticker key={i} id={PETS[i]} x={x} y={y} size={size} tilt={tilt} delay={SETTLED} />
      ))}

      <div style={{ position: 'absolute', left: 0, right: 0, top: 1660, textAlign: 'center' }}>
        <span style={{ display: 'inline-block', padding: '20px 44px', borderRadius: 999, background: C.ink, color: C.paper, fontWeight: 900, fontSize: 60 }}>
          {t.title} · {t.subtitle}
        </span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1790, textAlign: 'center', color: C.paper, fontWeight: 900, fontSize: 56, letterSpacing: 1 }}>{t.url}</div>
    </AbsoluteFill>
  );
}
