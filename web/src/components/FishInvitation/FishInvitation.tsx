import { useI18n } from '../../i18n';
import styles from './FishInvitation.module.css';

/** 第三个计入的普通局保存成功后出现的鱼关彩蛋邀请；点击进入鱼关准备在阶段 3 接入。 */
export function FishInvitation() {
  const { t } = useI18n();
  return (
    <div className={styles.card} role="note" data-testid="fish-invitation">
      <span className={styles.icon} aria-hidden>
        🐠
      </span>
      {t('fish.invitation')}
    </div>
  );
}
