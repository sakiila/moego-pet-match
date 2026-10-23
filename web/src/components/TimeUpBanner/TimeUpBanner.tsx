import { useI18n } from '../../i18n';
import styles from './TimeUpBanner.module.css';

/** 时间到后、进入报告前的停顿提示：盖住棋盘与按钮（此时只等进入报告，没有可做的操作）。 */
export function TimeUpBanner() {
  const { t } = useI18n();
  return (
    <div className={styles.scrim} role="status" aria-live="polite" data-testid="time-up">
      <div className={styles.pill}>{t('round.finished')}</div>
    </div>
  );
}
