import type { PlayerLikesState } from '../../game/playerLikes';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './PlayerLikes.module.css';

export interface PlayerLikesRowProps {
  state: PlayerLikesState;
  own?: boolean;
  onLike: () => void;
  onRetry: () => void;
}

/** The count always comes from the server; liking has no reverse action. */
export function PlayerLikesRow({ state, own = false, onLike, onRetry }: PlayerLikesRowProps) {
  const { t, locale } = useI18n();
  const { view, loading, sending, error, celebration } = state;
  const count = view?.receivedLikes.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
  const single = view?.receivedLikes === 1;
  const liked = view?.likedByViewer ?? false;
  return <div className={styles.group} data-testid="player-likes">
    <div className={styles.row} aria-busy={loading || sending}>
      <span key={celebration} className={`${styles.paw} ${celebration ? styles.success : ''}`}>
        <Icon name={!own && !liked ? 'player-like-high-five-outline' : 'player-like-high-five'} size={48} />
      </span>
      {view ? <div className={styles.count} aria-label={t(single ? 'likes.received_one' : 'likes.received', { count: count! })}>
        {t('likes.received_before') && <span>{t('likes.received_before')}</span>}
        <strong>{count}</strong><span>{t(single ? 'likes.received_after_one' : 'likes.received_after')}</span>
      </div> : <span className={styles.placeholder} role="status">{t(loading ? 'likes.loading' : 'likes.unavailable')}</span>}
      {!own && view && <button type="button" className={`${styles.likeButton} ${liked ? styles.likedButton : ''}`}
        onClick={onLike} disabled={sending || liked || !view.canLike} aria-busy={sending} data-testid="like-player">
        {t(liked ? 'likes.liked' : sending ? 'likes.sending' : 'likes.like')}
      </button>}
    </div>
    {error && <div className={styles.error} role="alert">
      <span>{t(error === 'send' ? 'likes.send_failed' : 'likes.load_failed')}</span>
      <button type="button" className={styles.retry} onClick={onRetry}>{t('action.retry')}</button>
    </div>}
    <span className={styles.srOnly} role="status" aria-live="polite">{celebration > 0 ? t('likes.success') : ''}</span>
  </div>;
}

export function PlayerLikesPill({ state, onOpen }: { state: PlayerLikesState; onOpen: () => void }) {
  const { t, locale } = useI18n();
  const count = state.view?.receivedLikes.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
  return <button type="button" className={styles.pill} onClick={onOpen} data-testid="my-likes"
    aria-label={count != null ? t(state.view?.receivedLikes === 1 ? 'likes.open_own_one' : 'likes.open_own', { count }) : t('likes.open_own_loading')}>
    <Icon name="player-like-high-five" size={28} />
    <span className={styles.pillCount}>{count ?? '—'}</span>
  </button>;
}
