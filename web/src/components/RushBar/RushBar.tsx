import { RULES } from '../../engine';
import { useI18n } from '../../i18n';
import styles from './RushBar.module.css';

export type RushView =
  | { state: 'hidden' }
  | { state: 'active'; served: number; secondsLeft: number }
  | { state: 'success' }
  | { state: 'expired' };

/** 催单小条：位于棋盘外的固定位置，与主时钟分开标明含义。 */
export function RushBar({ view }: { view: RushView }) {
  const { t } = useI18n();
  return (
    <div className={styles.slot} data-testid="rush" data-state={view.state}>
      {view.state === 'active' && (
        <div className={styles.bar} role="status">
          <div className={styles.head}>
            <span className={styles.title}>🔥 {t('rush.title')}</span>
            <span className={styles.remaining}>{t('rush.remaining', { seconds: view.secondsLeft })}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.served}>{t('rush.served', { count: Math.min(view.served, RULES.rush.target) })}</span>
            <span className={styles.track}>
              <span className={styles.fill} style={{ width: `${Math.min(1, view.served / RULES.rush.target) * 100}%`, display: 'block' }} />
            </span>
            <span>{t('rush.goal')}</span>
          </div>
        </div>
      )}
      {view.state === 'success' && (
        <div className={`${styles.bar} ${styles.success}`} role="status">
          <div className={styles.message}>{t('rush.success')}</div>
        </div>
      )}
      {view.state === 'expired' && (
        <div className={`${styles.bar} ${styles.expired}`} role="status">
          <div className={styles.message}>{t('rush.expired')}</div>
        </div>
      )}
    </div>
  );
}
