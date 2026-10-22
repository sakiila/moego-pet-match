import type { ReactNode } from 'react';
import { useI18n, type MessageKey } from '../../i18n';
import styles from './BrandHeader.module.css';

export interface BrandHeaderProps {
  /** game：游戏名（身份页、门店）；scheduling：Smart Scheduling（准备、棋盘）。 */
  title?: 'game' | 'scheduling';
  /** 标题下的一句说明。 */
  tagline?: MessageKey;
  /** 右上角额外内容（如当前身份头像）。 */
  trailing?: ReactNode;
  /** 以普通页标题代替品牌标题（如排行榜）。 */
  heading?: string;
  /** 提供时在右上角显示「回门店」。 */
  onBack?: () => void;
}

/** 顶部：MoeGo 字标 + 中/EN 切换 + 标题；切换只改界面文字，不影响本局。 */
export function BrandHeader({ title = 'scheduling', tagline, trailing, heading, onBack }: BrandHeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const [lead, accent] =
    title === 'game'
      ? [t('brand.title_lead'), t('brand.title_accent')]
      : (() => {
          const [first, ...rest] = t('board.title').split(' ');
          return [first, rest.join(' ')];
        })();
  return (
    <header>
      <div className={styles.bar}>
        <span className={styles.wordmark}>
          Moe<span>Go</span>
        </span>
        <span className={styles.right}>
          {onBack && (
            <button type="button" className={styles.back} onClick={onBack} data-testid="back">
              ‹ {t('action.back_to_shop')}
            </button>
          )}
          <span className={styles.lang}>
            <button type="button" aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>
              中
            </button>
            /
            <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>
              EN
            </button>
          </span>
          {trailing}
        </span>
      </div>
      {heading ? (
        <h1 className={`${styles.title} ${styles.heading}`}>{heading}</h1>
      ) : (
        <h1 className={styles.title}>
          {lead}
          {locale === 'en' || title === 'scheduling' ? ' ' : ''}
          <em>{accent}</em>
        </h1>
      )}
      {tagline && <p className={styles.tagline}>{t(tagline)}</p>}
    </header>
  );
}
