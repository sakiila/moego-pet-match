import { useEffect, useRef, useState } from 'react';
import type { PawMessage, PetPaw } from '../../api/types';
import type { PawBookState } from '../../game/pawBook';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { Button } from '../../ui/primitives/Button';
import { Icon, type IconName } from '../../ui/primitives/Icon';
import { Sheet } from '../../ui/primitives/Sheet';
import styles from './PawBook.module.css';

const CHOICES: { message: PawMessage; icon: IconName }[] = [
  { message: 'cute', icon: 'paw-cute' }, { message: 'pets', icon: 'paw-pets' },
  { message: 'play', icon: 'paw-play' }, { message: 'love', icon: 'paw-love' },
];

/** 确实进入可见视口且页面在前台才确认；分页和被裁切的行保持未读。 */
function useSeen(unread: boolean, onSeen: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!unread || !ref.current) return;
    const observer = new IntersectionObserver(entries => {
      if (document.visibilityState === 'visible' && entries.some(e => e.isIntersecting && e.intersectionRatio >= 0.5)) onSeen();
    }, { threshold: 0.5 });
    const observe = () => { if (ref.current) { observer.unobserve(ref.current); observer.observe(ref.current); } };
    observe(); document.addEventListener('visibilitychange', observe);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', observe); };
  }, [unread, onSeen]);
  return ref;
}

interface SharedProps { avatarSrc: (id: string) => string | null; onRead: (id: string, kind: 'message' | 'reply') => void }
function PawReply({ paw, petName, avatarSrc, onRead }: SharedProps & { paw: PetPaw; petName: string }) {
  const { t } = useI18n();
  const seen = useSeen(paw.unreadReply, () => onRead(paw.id, 'reply'));
  if (!paw.reply) return null;
  return <div ref={seen} className={styles.reply} data-testid="paw-reply">
    <Avatar name={paw.reply.owner.name} seed={paw.reply.owner.userId} src={avatarSrc(paw.reply.owner.userId)} size={28} />
    <span>{t('paw_book.reply_text', { owner: paw.reply.owner.name, pet: petName })}</span><Icon name="paw-print" size={22} />
  </div>;
}

function PawRow({ paw, own, petName, busy, avatarSrc, onRead, onReply }: SharedProps & {
  paw: PetPaw; own: boolean; petName: string; busy: boolean; onReply: (paw: PetPaw) => void;
}) {
  const { t, locale } = useI18n();
  const seen = useSeen(paw.unreadMessage, () => onRead(paw.id, 'message'));
  return <div ref={seen} className={styles.row} data-testid="paw-row">
    <Avatar name={paw.sender.name} seed={paw.sender.userId} src={avatarSrc(paw.sender.userId)} size={36} />
    <div className={styles.rowBody}>
      <div className={styles.person}><strong>{paw.sender.name}</strong>{paw.unreadMessage && <span className={styles.new}>{t('paw_book.new')}</span>}</div>
      <span className={styles.phrase}>{t(`paw_book.message.${paw.message}`)}</span>
      {!own && paw.reply && <PawReply paw={paw} petName={petName} avatarSrc={avatarSrc} onRead={onRead} />}
    </div>
    {own ? paw.reply ? <span className={styles.done}><Icon name="paw-print" size={18} />{t('paw_book.replied')}</span>
      : <button className={styles.respond} type="button" disabled={busy} onClick={() => onReply(paw)}>{t('paw_book.reply')}</button>
      : <time className={styles.date} dateTime={paw.createdAt}>{new Date(paw.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}</time>}
  </div>;
}

export interface PawBookProps extends SharedProps {
  petName: string;
  stickerSrc: string;
  state: PawBookState;
  onChange: (message: PawMessage | null) => void;
  onReply: (paw: PetPaw) => void;
  onRetry: () => void;
  onMore: () => void;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
  inline?: boolean;
}

export function PawBook({ petName, stickerSrc, state, onChange, onReply, onRetry, onMore, onClose, avatarSrc, onRead, returnFocus, inline }: PawBookProps) {
  const { t, locale } = useI18n();
  const [visible, setVisible] = useState(3);
  const { view, sending, loadingMore } = state;
  const count = view?.count ?? 0;
  const rows = view?.entries.slice(0, visible) ?? [];
  const more = !!view && (visible < view.entries.length || !!view.nextCursor);
  return <Sheet open aboveDetail trapFocus returnFocus={returnFocus} inline={inline} label={t('paw_book.label', { pet: petName })} closeLabel={t('action.close')} onClose={onClose}
    badge={<header className={styles.header}><img src={stickerSrc} alt="" /><div><h2>{t('paw_book.title')}</h2><p>{petName}</p></div></header>}>
    <section className={styles.book} data-testid="paw-book" aria-busy={state.loading || sending}>
      {view && <p className={styles.count}>{t(count === 1 ? 'paw_book.count_one' : 'paw_book.count_other', { count: count.toLocaleString(locale) })}</p>}
      {state.loading && <p role="status" className={styles.muted}>{t('paw_book.loading')}</p>}
      {state.unavailable ? <p role="alert">{t('paw_book.unavailable')}</p> : state.error && <div className={styles.error} role="alert">
        <span>{t(state.error === 'send' ? 'paw_book.send_failed' : 'paw_book.load_failed')}</span>
        <Button variant="secondary" disabled={sending} onClick={onRetry}>{t('action.retry')}</Button>
      </div>}
      {view && !view.own && <div className={styles.mine}>
        <h3>{t(view.mine ? 'paw_book.yours' : 'paw_book.prompt')}</h3>
        <div className={styles.choices}>
          {CHOICES.map(({ message, icon }) => <button key={message} type="button" className={styles.choice}
            aria-pressed={view.mine?.message === message} disabled={sending} onClick={() => onChange(message)} data-testid={`paw-${message}`}>
            <Icon name={icon} size={24} /><span>{t(`paw_book.message.${message}`)}</span>
            {view.mine?.message === message && <span className={styles.check} aria-hidden><Icon name="selected-check" size={20} /></span>}
          </button>)}
        </div>
        <div className={styles.mineStatus} aria-live="polite">
          {sending ? <span>{t('paw_book.sending')}</span> : view.mine ? <strong key={state.celebration} className={styles.success}><Icon name="paw-print" size={20} />{t('paw_book.left')}</strong> : <span />}
          {view.mine && <button type="button" className={styles.textAction} disabled={sending} onClick={() => onChange(null)}>{t('paw_book.withdraw')}</button>}
        </div>
        {view.mine?.reply && <PawReply paw={view.mine} petName={petName} avatarSrc={avatarSrc} onRead={onRead} />}
      </div>}
      {view?.own && view.unreadCount > 0 && <div className={styles.summary}><Icon name="paw-print" size={28} />{t(view.unreadCount === 1 ? 'paw_book.new_count_one' : 'paw_book.new_count', { count: view.unreadCount.toLocaleString(locale) })}</div>}
      {view && (view.own || count === 0 || view.entries.length > 0) && <div className={styles.entries}>
        {!view.own && <h3>{t('paw_book.others')}</h3>}
        {count === 0 && <p className={styles.muted}>{t(view.own ? 'paw_book.empty_own' : 'paw_book.empty')}</p>}
        {rows.map(paw => <PawRow key={paw.id} paw={paw} own={view.own} busy={sending} petName={petName} avatarSrc={avatarSrc} onRead={onRead} onReply={onReply} />)}
        {more && <button type="button" className={styles.more} disabled={loadingMore || sending} onClick={() => {
          if (visible >= view.entries.length) onMore();
          setVisible(v => v + 20);
        }}>{t(loadingMore ? 'paw_book.loading' : 'paw_book.more')}<Icon name="forward-arrow" size={16} /></button>}
      </div>}
      {view?.own && <p className={styles.ownerHint}>{t('paw_book.owner_hint', { pet: petName })}</p>}
    </section>
  </Sheet>;
}
