import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './SocialEntry.module.css';

export function SocialEntry({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <button className={styles.entry} onClick={onOpen}>
      <Icon name="social-feed" size={44} />
      <span className={styles.text}>
        <strong>{t('social.title')}</strong>
        <small>{t('social.entry_hint')}</small>
      </span>
      <Icon name="forward-arrow" size={20} />
    </button>
  );
}
