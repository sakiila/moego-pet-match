import type { PawNotice } from '../../api/types';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './PawNotices.module.css';

export function PawNotices({ items, kind, onOpen }: { items: PawNotice[]; kind: 'message' | 'reply'; onOpen: (item: PawNotice, origin: HTMLElement) => void }) {
  const { t, locale } = useI18n();
  if (!items.length) return null;
  return <div className={styles.list}>
    {items.map(item => <button key={item.petId} type="button" className={styles.notice} onClick={e => onOpen(item, e.currentTarget)} data-testid={`paw-notice-${kind}`}>
      <Icon name="paw-print" size={22} /><span>{t(kind === 'message' ? item.count === 1 ? 'paw_book.message_notice_one' : 'paw_book.message_notice' : 'paw_book.reply_notice', { pet: item.petName, count: item.count.toLocaleString(locale) })}</span><Icon name="forward-arrow" size={16} />
    </button>)}
  </div>;
}
