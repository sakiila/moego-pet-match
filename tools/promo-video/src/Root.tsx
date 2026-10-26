import { Composition, staticFile, type CalculateMetadataFunction } from 'remotion';
import { Promo, type PromoProps } from './Promo';
import { DURATION, FPS } from './timeline';

/** 录屏种子：棋盘 135、走法 2（见 STORYBOARD「录屏种子」）。 */
const recording = (lang: string) => `recordings/135-2-${lang}`;

const withTiming: CalculateMetadataFunction<PromoProps> = async ({ props }) => ({
  props: { ...props, timing: await fetch(staticFile(`${props.recording}/timing.json`)).then((r) => r.json()) },
});

export function Root() {
  return (
    <>
      <Composition id="PromoZh" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ lang: 'zh', recording: recording('zh') }} calculateMetadata={withTiming} />
      <Composition id="PromoEn" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ lang: 'en', recording: recording('en') }} calculateMetadata={withTiming} />
    </>
  );
}
