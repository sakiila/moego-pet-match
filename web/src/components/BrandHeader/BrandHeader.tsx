import type { ReactNode } from 'react';
import { useI18n, type MessageKey } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import logoSrc from '../../ui/art/moego-logo.webp';
import titleEnSrc from '../../ui/art/title-en.webp';
import titleZhSrc from '../../ui/art/title-zh.webp';
import hallEnSrc from '../../ui/art/hall-title-en.webp';
import hallZhSrc from '../../ui/art/hall-title-zh.webp';
import schedulingSrc from '../../ui/art/smart-scheduling.webp';
import reportSrc from '../../ui/art/grooming-report-card.webp';
import fishReportSrc from '../../ui/art/fish-report-card.webp';
import styles from './BrandHeader.module.css';

export interface BrandHeaderProps {
  /** game：游戏名；scheduling：Smart Scheduling；fish：鱼关；hall：光荣榜；report / fish-report：结算页字标。 */
  title?: 'game' | 'scheduling' | 'fish' | 'hall' | 'report' | 'fish-report';
  /** 标题下的一句说明。 */
  tagline?: MessageKey;
  /** 右上角额外内容（如当前身份头像）。 */
  trailing?: ReactNode;
  /** 以普通页标题代替品牌标题（如排行榜）。 */
  heading?: string;
  /** 提供时在右上角显示「回门店」。 */
  onBack?: () => void;
  /** heading 居中，首词深色、其余品牌色（与 Smart Scheduling 一致）。 */
  headingAccent?: boolean;
  /** 与普通页标题同一行、靠右的一个操作（如图鉴的「添加我家毛孩子」）。 */
  headingAction?: ReactNode;
  /** 普通准备页使用已确认的文字素材；棋盘保持原标题。 */
  schedulingArt?: boolean;
  /** 棋盘的品牌行；普通局用确认字标，鱼关保留鱼关标题。 */
  boardArt?: boolean;
}

/** 顶部：MoeGo 字标 + 中/EN 切换 + 标题；切换只改界面文字，不影响本局。 */
export function BrandHeader({ title = 'scheduling', tagline, trailing, heading, onBack, headingAccent, headingAction, schedulingArt = false, boardArt = false }: BrandHeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const report = title === 'report' || title === 'fish-report';
  const [lead, accent] =
    title === 'game'
      ? [t('brand.title_lead'), t('brand.title_accent')]
      : title === 'fish'
        ? [t('fish.prep_title'), '']
        : (() => {
          const [first, ...rest] = t('board.title').split(' ');
          return [first, rest.join(' ')];
        })();
  return (
    <header className={boardArt ? styles.boardHeader : schedulingArt ? styles.preparation : report ? styles.reportHeader : undefined}>
      <div className={styles.bar}>
        {/* 浅色页面用官方 Logo；鱼关深蓝底上 Logo 看不清，改用白色文字字标（CSS 按主题切换） */}
        <img className={styles.logo} src={logoSrc} alt="MoeGo" width={120} height={32} />
        <span className={styles.wordmark} aria-hidden>
          Moe<span>Go</span>
        </span>
        <span className={styles.right}>
          {onBack && (
            <button type="button" className={styles.back} onClick={onBack} data-testid="back">
              <Icon name="back-to-shop" size={22} />
              {t('action.back_to_shop')}
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
      {heading && headingAccent ? (
        <h1 className={styles.title}>
          {heading.split(' ')[0]} <em>{heading.split(' ').slice(1).join(' ')}</em>
        </h1>
      ) : heading && headingAction ? (
        <div className={styles.headingRow}>
          <h1 className={`${styles.title} ${styles.heading}`}>{heading}</h1>
          {headingAction}
        </div>
      ) : heading ? (
        <h1 className={`${styles.title} ${styles.heading}`}>{heading}</h1>
      ) : report ? (
        <h1 className={styles.reportTitle}>
          <img src={title === 'fish-report' ? fishReportSrc : reportSrc} alt={t(title === 'fish-report' ? 'fish.report_title' : 'report.title')} width={1080} height={title === 'fish-report' ? 393 : 307} />
        </h1>
      ) : title === 'scheduling' && (schedulingArt || boardArt) ? (
        <h1 className={styles.schedulingTitle}>
          <img src={schedulingSrc} alt={t('board.title')} width={1080} height={200} />
        </h1>
      ) : title === 'game' ? (
        <h1 className={styles.gameTitle}>
          {/* 标题字标（Codex 出图，已确认）；读屏读原文字 */}
          <img src={locale === 'en' ? titleEnSrc : titleZhSrc} alt={`${lead}${locale === 'en' ? ' ' : ''}${accent}`} />
        </h1>
      ) : title === 'hall' ? (
        <h1 className={styles.gameTitle}>
          <img src={locale === 'en' ? hallEnSrc : hallZhSrc} alt={t('leaderboard.hall_of_fame')} />
        </h1>
      ) : (
        <h1 className={styles.title}>
          {lead}
          {accent && (locale === 'en' || title === 'scheduling') ? ' ' : ''}
          {accent && <em>{accent}</em>}
        </h1>
      )}
      {tagline && <p className={`${styles.tagline} ${title === 'game' || title === 'hall' ? styles.gameTagline : ''}`}>{t(tagline)}</p>}
    </header>
  );
}
