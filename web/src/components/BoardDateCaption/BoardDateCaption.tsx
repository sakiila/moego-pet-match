import { formatBoardDate } from '../../game/standing';
import { useI18n } from '../../i18n';
import styles from './BoardDateCaption.module.css';

export interface BoardDateCaptionProps {
  /** 北京日期 YYYY-MM-DD。 */
  date: string;
}

/** 今日榜下的一行小字：日期 + 「今天全公司同一盘棋」，前面一个小日历（SVG）。 */
export function BoardDateCaption({ date }: BoardDateCaptionProps) {
  const { t, locale } = useI18n();
  return (
    <p className={styles.caption} data-testid="board-date">
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden focusable="false">
        <rect x="2.5" y="4" width="15" height="13" rx="3" fill="var(--color-paper)" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="10" cy="13" r="1.9" fill="currentColor" />
      </svg>
      {t('leaderboard.today_caption', { date: formatBoardDate(date, locale) })}
    </p>
  );
}
