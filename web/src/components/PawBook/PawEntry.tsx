import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './PawEntry.module.css';
import type { Ref } from 'react';

export interface PawEntryProps { own: boolean; left: boolean; loading?: boolean; locked?: boolean; unavailable?: boolean; onOpen: () => void; buttonRef?: Ref<HTMLButtonElement> }
export function PawEntry({ own, left, loading = false, locked = false, unavailable = false, onOpen, buttonRef }: PawEntryProps) {
  const { t } = useI18n();
  if (locked) return <p className={styles.locked}>{t('paw_book.locked')}</p>;
  return <button ref={buttonRef} type="button" className={styles.entry} disabled={unavailable} aria-busy={loading} onClick={onOpen} data-testid="paw-entry">
    <Icon name="paw-print" size={32} /><span>{t(unavailable ? 'paw_book.unavailable' : own ? 'paw_book.open_own' : left ? 'paw_book.left' : 'paw_book.leave')}</span><Icon name="paw-entry-arrow" size={16} />
  </button>;
}
