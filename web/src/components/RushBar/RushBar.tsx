import type { GameMode } from '../../api/types';
import { RULES } from '../../engine';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './RushBar.module.css';

export type RushView =
  | { state: 'hidden' }
  | { state: 'active'; served: number; secondsLeft: number }
  | { state: 'success' }
  | { state: 'expired' };

/** 催单小条：位于棋盘外的固定位置，与主时钟分开标明含义。鱼关用「Peter 的小鱼加急」与「已清除」，计时与奖励相同。 */
export function RushBar({ view, mode = 'normal' }: { view: RushView; mode?: GameMode }) {
  const { t } = useI18n();
  const fish = mode === 'fish';
  return (
    <div className={styles.slot} data-testid="rush" data-state={view.state}>
      {view.state === 'active' && (
        <div className={styles.bar} role="status">
          <Icon name="rush-ticket" size={42} />
          <div className={styles.body}>
          <div className={styles.head}>
            <span className={styles.title}>{t(fish ? 'fish.rush_title' : 'rush.title')}</span>
            <span className={styles.remaining}>{t('rush.remaining', { seconds: view.secondsLeft })}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.served}>{t(fish ? 'fish.rush_served' : 'rush.served', { count: Math.min(view.served, RULES.rush.target) })}</span>
            <span className={styles.track}>
              <span className={styles.fill} style={{ width: `${Math.min(1, view.served / RULES.rush.target) * 100}%`, display: 'block' }} />
            </span>
            <span>{t(fish ? 'fish.rush_goal' : 'rush.goal')}</span>
          </div>
          </div>
        </div>
      )}
      {view.state === 'success' && (
        <div className={`${styles.bar} ${styles.success}`} role="status">
          <Icon name="completed-mark" size={42} />
          <div className={styles.message}>{t('rush.success')}</div>
        </div>
      )}
      {view.state === 'expired' && (
        <div className={`${styles.bar} ${styles.expired}`} role="status">
          <Icon name="expired-ticket" size={42} />
          <div className={styles.message}>{t('rush.expired')}</div>
        </div>
      )}
    </div>
  );
}
