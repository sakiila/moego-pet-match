import type { TitleKey } from '../../game/report';
import { titleStampUrl } from '../../game/titleStamps';
import { useI18n } from '../../i18n';
import styles from './TitleStamp.module.css';

/**
 * 本局称号章：趣味称号章（report-title-stamps-original-v1），随界面语言显示中文或英文版；
 * 读屏读称号原文。找不到图片时退回文字小章。
 */
export function TitleStamp({ title, width = 120 }: { title: TitleKey; width?: number }) {
  const { t, locale } = useI18n();
  const src = titleStampUrl(title, locale);
  if (!src) {
    return <span className={styles.fallback}>{t(title)}</span>;
  }
  return <img className={styles.stamp} src={src} alt={t(title)} width={width} height={width} draggable={false} />;
}
