import type { Standing } from '../../game/standing';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './TodayStanding.module.css';

export interface TodayStandingProps {
  standing: Standing;
}

/**
 * 报告页「今日名次」小条（mobile-report-daily-rank-v1）：放在分数下方的小票内，次于分数。
 * 第 1 名只报喜；其他名次给出与第一名的差距（差一点就赢）；今天只有自己时邀请同事来挑战。
 */
export function TodayStanding({ standing }: TodayStandingProps) {
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
  const alone = standing.participants <= 1;
  const first = standing.rank === 1;
  return (
    <span className={styles.chip} data-testid="today-standing" data-first={first || undefined}>
      <Icon name="rank-1" size={22} />
      {alone ? (
        <span className={styles.main}>{t('report.today_alone')}</span>
      ) : first ? (
        <span className={styles.main}>{t('report.today_first')}</span>
      ) : (
        <>
          <span className={styles.main}>{t('report.today_rank', { rank: standing.rank })}</span>
          <span className={styles.dot} aria-hidden />
          <span className={styles.gap}>{t('report.today_gap', { points: fmt(standing.leaderScore - standing.score) })}</span>
        </>
      )}
    </span>
  );
}
