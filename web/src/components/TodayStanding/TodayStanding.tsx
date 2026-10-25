import type { Standing } from '../../game/standing';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './TodayStanding.module.css';

export interface TodayStandingProps {
  standing: Standing;
}

/**
 * 报告分数下的「今日名次」小标签（mobile-report-slim-v1）：只报名次，不报差距、不跳转。
 * 第 1 名与今天只有自己时各有一句。
 */
export function TodayStanding({ standing }: TodayStandingProps) {
  const { t } = useI18n();
  const alone = standing.participants <= 1;
  const first = standing.rank === 1;
  return (
    <span className={styles.chip} data-testid="today-standing" data-first={first || undefined}>
      <Icon name="rank-1" size={18} />
      <span className={styles.main}>{alone ? t('report.today_alone') : first ? t('report.today_first') : t('report.today_rank', { rank: standing.rank })}</span>
    </span>
  );
}
