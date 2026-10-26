import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './SoundTip.module.css';

export function SoundTip({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  return (
    <aside className={styles.tip} role="status" data-testid="sound-tip">
      <div className={styles.header}>
        <Icon name="music" size={28} />
        <h2 className={styles.title}>{t('home.sound_tip_title')}</h2>
        <button type="button" className={styles.close} aria-label={t('action.close')} onClick={onClose}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <p className={styles.body}>
        {t('home.sound_tip_lead')}{locale === 'zh' ? <br /> : ' '}
        <strong>{t('home.sound_tip_features')}</strong>{t('home.sound_tip_tail')}
      </p>
    </aside>
  );
}
