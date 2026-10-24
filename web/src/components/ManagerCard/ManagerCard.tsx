import { useId, useState } from 'react';
import { useI18n } from '../../i18n';
import storefrontSrc from '../../ui/art/storefront-v2.webp';
import styles from './ManagerCard.module.css';

export interface ManagerCardProps {
  name: string;
  stickerSrc: string;
  /** shop：门店橱窗与上班宣言；signature：报告末尾的形象与签名。 */
  variant?: 'shop' | 'signature';
  /** 门店：点店长打开店长小海报（不自动弹出）。 */
  onOpen?: () => void;
}

/*
 * 气泡轮廓（一条闭合路径，椭圆身 + 左下小尾巴），三层叠出贴纸感：
 * 白色粗描边作贴纸外圈 → 白底 → 炭黑手绘线（略不闭合、末端越过起点，经轻微扰动有手抖感），左上再补一笔短弧高光。
 * viewBox 随气泡拉伸，描边用 non-scaling-stroke 保持粗细。
 */
const BUBBLE_PATH =
  'M60 93C22 87 4 69 6 48C8 22 46 5 101 5C157 5 195 23 194 51C193 78 156 97 104 97C94 97 85 96.5 77 95.5L42 116Z';
const BUBBLE_INK =
  'M58 92.5C21 86 3.5 68 6.5 47C9 21 47 4.5 102 5.5C158 6 196 24 193.5 52C191 79 155 97.5 103 96.5C94 96.4 85 96 77.5 95L43 115.5L61.5 91';

function BubbleOutline() {
  const wobble = `bubble-wobble-${useId()}`;
  return (
    <svg className={styles.bubbleShape} viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden>
      <filter id={wobble} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="2.4" />
      </filter>
      <path className={styles.bubbleRim} d={BUBBLE_PATH} vectorEffect="non-scaling-stroke" />
      <path className={styles.bubbleFill} d={BUBBLE_PATH} />
      <g filter={`url(#${wobble})`}>
        <path className={styles.bubbleInk} d={BUBBLE_INK} vectorEffect="non-scaling-stroke" />
        <path className={styles.bubbleGloss} d="M24 36C30 24 42 17 56 13" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/** 今日店长：全公司同一只；宣言为游戏模板台词，不冒充主人原话。 */
export function ManagerCard({ name, stickerSrc, variant = 'shop', onOpen }: ManagerCardProps) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  // 贴纸读取失败时保留同尺寸空位，橱窗布局不塌
  const sticker = failed ? (
    <span className={styles.sticker} aria-hidden />
  ) : (
    <img className={styles.sticker} src={stickerSrc} alt="" onError={() => setFailed(true)} />
  );
  const plate = (
    <span className={styles.plate}>
      {t('home.manager')} · {name}
    </span>
  );

  if (variant === 'signature') {
    return (
      <figure className={styles.signature} data-testid="manager-signature">
        <span className={styles.avatar}>{sticker}</span>
        <figcaption>
          {plate}
          <q>{t('home.manager_line')}</q>
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className={styles.shop} data-testid="manager-card">
      {onOpen && <button type="button" className={styles.open} onClick={onOpen} aria-label={t('manager.poster_title')} data-testid="manager-open" />}
      {/* 店面框插画（遮阳棚、立柱、盆栽、招牌、柜台），橱窗留空，店长与气泡、名牌由代码叠加 */}
      <img className={styles.frame} src={storefrontSrc} alt="" draggable={false} />
      <div className={styles.window}>{sticker}</div>
      {/* 头像两侧的橙色短线（mobile-home-v2），交替闪烁 */}
      <span className={`${styles.spark} ${styles.sparkLeft}`} aria-hidden />
      <span className={`${styles.spark} ${styles.sparkRight}`} aria-hidden />
      <span className={`${styles.spark} ${styles.sparkLow}`} aria-hidden />
      {/* 英文宣言较长时缩一档字号，气泡不压住右侧招牌 */}
      <span className={styles.bubble} data-long={t('home.manager_line').length > 16 || undefined}>
        <BubbleOutline />
        <span className={styles.bubbleText}>{t('home.manager_line')}</span>
      </span>
      {/* 门店名牌：一行「今日店长 · 名字」，像立在柜台上的一块厚木牌 */}
      <figcaption className={styles.caption}>
        <span className={styles.nameplate}>
          <span className={styles.role}>{t('home.manager')}</span>
          <span className={styles.dot} aria-hidden>
            ·
          </span>
          <span className={styles.name}>{name}</span>
        </span>
      </figcaption>
    </figure>
  );
}
