import { useI18n } from '../../i18n';
import styles from './FishInvitation.module.css';

/** 第三个计入的普通局保存成功后出现的鱼关彩蛋邀请；玩家主动点击才进入鱼关准备，不自动跳转。 */
export function FishInvitation({ onOpen }: { onOpen?: () => void }) {
  const { t } = useI18n();
  return (
    <div className={styles.card} role="note" data-testid="fish-invitation">
      <span className={styles.icon} aria-hidden>
        🐠
      </span>
      <span className={styles.text}>{t('fish.invitation')}</span>
      {onOpen && (
        <button type="button" className={styles.action} onClick={onOpen} data-testid="fish-invitation-open">
          {t('fish.invitation_action')} ›
        </button>
      )}
    </div>
  );
}
