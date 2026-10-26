import { Composition, staticFile, type CalculateMetadataFunction } from 'remotion';
import { Cover } from './Cover';
import { Promo, type PromoProps } from './Promo';
import { DURATION, FPS } from './timeline';

/** 录屏种子：棋盘 135、走法 2（见 STORYBOARD「录屏种子」）。 */
const recording = (lang: string) => `recordings/135-2-${lang}`;

const withTiming = (async ({ props }) => ({
  props: { ...props, timing: await fetch(staticFile(`${props.recording}/timing.json`)).then((r) => r.json()) },
})) satisfies CalculateMetadataFunction<PromoProps>;

export function Root() {
  return (
    <>
      <Composition id="PromoZh" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ lang: 'zh', recording: recording('zh') }} calculateMetadata={withTiming} />
      <Composition id="PromoEn" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ lang: 'en', recording: recording('en') }} calculateMetadata={withTiming} />
      {/* 封面用 30fps、1 帧的普通合成：Still 默认 1fps，录屏的帧号会被当成秒数 */}
      <Composition id="CoverZh" component={CoverStill} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{ lang: 'zh', recording: recording('zh') }} calculateMetadata={withTiming} />
    </>
  );
}

/** 封面单独导出：timing 由 calculateMetadata 读入后才渲染。 */
function CoverStill({ lang, timing, recording }: PromoProps) {
  return timing ? <Cover lang={lang} timing={timing} recording={recording} /> : null;
}
