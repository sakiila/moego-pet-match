import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './InfoSummary.module.css';

/** 身份确认按钮附近的信息使用摘要；点击确认即表示同意，不另设勾选框。 */
export function InfoSummary() {
  const { t } = useI18n();
  return (
    <div className={styles.box}>
      <Icon name="information" size={26} />
      <p>{t('info.entry_summary')}</p>
    </div>
  );
}
