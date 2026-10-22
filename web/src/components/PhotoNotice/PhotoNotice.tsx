import { useI18n } from '../../i18n';
import styles from './PhotoNotice.module.css';

/** 首页底部常驻的人工处理提示，保留用户指定原句。 */
export function PhotoNotice() {
  const { t } = useI18n();
  return (
    <p className={styles.notice}>
      <span className={styles.icon} aria-hidden>
        📷
      </span>
      <span>{t('home.photo_notice')}</span>
    </p>
  );
}
