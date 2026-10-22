import { useI18n } from '../../i18n';
import styles from './RulesCard.module.css';

/** 开局前只教三消与两种交换方式；工具用法留到首次自然出现时提示。 */
export function RulesCard() {
  const { t } = useI18n();
  return (
    <>
      <div className={styles.card}>
        <p className={styles.row}>
          <span className={styles.icon} aria-hidden>
            🔁
          </span>
          {t('prep.rule')}
        </p>
        <p className={styles.row}>
          <span className={styles.icon} aria-hidden>
            👆
          </span>
          {t('prep.controls')}
        </p>
      </div>
      <p className={styles.timer}>
        <span aria-hidden>⏱️</span>
        {t('prep.timer_hint')}
      </p>
    </>
  );
}
