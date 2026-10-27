import { useState } from 'react';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import { useSeasonalTheme } from '../SeasonalTheme/SeasonalTheme';
import styles from './SocialEntry.module.css';

export function SocialEntry({ onOpen, faces = [] }: { onOpen: () => void; faces?: string[] }) {
  const { t } = useI18n();
  const seasonal = useSeasonalTheme();
  const [failed, setFailed] = useState<string[]>([]);
  const visible = seasonal ? faces.filter(src => !failed.includes(src)).slice(0, 2) : [];
  return (
    <button className={styles.entry} onClick={onOpen}>
      {visible.length ? <span className={styles.faces} aria-hidden>
        {visible.map(src => <img key={src} src={src} alt="" draggable={false}
          onError={() => setFailed(previous => previous.includes(src) ? previous : [...previous, src])} />)}
      </span> : <Icon name="social-feed" size={44} />}
      <span className={styles.text}>
        <strong>{t('social.title')}</strong>
        <small>{t('social.entry_hint')}</small>
      </span>
      <Icon name="forward-arrow" size={20} />
    </button>
  );
}
