import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './StatusPanel.module.css';

export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export interface StatusPanelProps {
  timeLeftMs: number;
  score: number;
}

/** 本局剩余与分数：位置固定，最后 10 秒只加强倒计时辨识度。 */
export function StatusPanel({ timeLeftMs, score }: StatusPanelProps) {
  const { t, locale } = useI18n();
  const urgent = timeLeftMs > 0 && timeLeftMs <= 10_000;
  return (
    <div className={styles.panel}>
      <div className={`${styles.card} ${styles.time} ${urgent ? styles.urgent : ''}`} aria-label={t('board.time_left', { seconds: Math.ceil(timeLeftMs / 1000) })}>
        <Icon name="round-clock" className={styles.icon} size={44} />
        <span className={styles.readout}>
          <span className={styles.label}>{t('board.time_label')}</span>
          <span className={styles.value} data-testid="time-left">
            {formatClock(timeLeftMs)}
          </span>
        </span>
      </div>
      <div className={`${styles.card} ${styles.score}`} data-digits={score >= 100_000 ? 'long' : score >= 10_000 ? 'wide' : undefined}>
        <Icon name="round-score" className={styles.icon} size={44} />
        <span className={styles.readout}>
          <span className={styles.label}>{t('board.score_label')}</span>
          <span className={styles.value} data-testid="score">
            {score.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
          </span>
        </span>
      </div>
    </div>
  );
}
