import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './BoardControls.module.css';

export interface BoardControlsProps {
  timeUp?: boolean;
  onSettings: () => void;
  onExit: () => void;
}

export function BoardControls({ timeUp = false, onSettings, onExit }: BoardControlsProps) {
  const { t } = useI18n();
  return <footer className={styles.controls}>
    <button type="button" onClick={onSettings} disabled={timeUp}><Icon name="settings" size={24} />{t('nav.settings')}</button>
    <button type="button" onClick={onExit} disabled={timeUp} data-testid="exit">{t('board.exit')}<Icon name="exit" size={24} /></button>
  </footer>;
}

