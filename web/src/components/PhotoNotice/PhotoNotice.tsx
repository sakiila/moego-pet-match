import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './PhotoNotice.module.css';

/** 首页底部常驻的人工处理提示，保留用户指定原句。 */
export function PhotoNotice() {
  const { t } = useI18n();
  return (
    <p className={styles.notice}>
      <Icon name="choose-photo" size={28} />
      <span>{t('home.photo_notice')}</span>
    </p>
  );
}
