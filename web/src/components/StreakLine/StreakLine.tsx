import type { Streak } from '../../api/types';
import { useI18n } from '../../i18n';
import styles from './StreakLine.module.css';

export interface StreakLineProps {
  streak: Streak;
}

/** 首页「开始营业」下的一行：连续开工天数与今天是否已打卡；归零时邀请今天开一局。 */
export function StreakLine({ streak }: StreakLineProps) {
  const { t } = useI18n();
  const key = streak.days === 0 ? 'home.streak_none' : streak.today ? 'home.streak_active' : 'home.streak_pending';
  return (
    <p className={styles.line} data-testid="streak" data-state={streak.days === 0 ? 'none' : streak.today ? 'active' : 'pending'}>
      {t(key, { days: streak.days })}
    </p>
  );
}
