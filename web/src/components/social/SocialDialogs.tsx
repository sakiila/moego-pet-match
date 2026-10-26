import { useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import type { SocialPost } from '../../social/model';
import { Sheet } from '../../ui/primitives/Sheet';
import { Button } from '../../ui/primitives/Button';
import { Icon } from '../../ui/primitives/Icon';
import { useSocialModal } from './useSocialModal';
import styles from './Social.module.css';

export type SocialOverlay =
  | { kind: 'menu' | 'remove' | 'feedback'; post: SocialPost }
  | { kind: 'discard'; leave: 'back' | 'home' }
  | { kind: 'info' | 'reset' };
export function SocialDialogs({
  overlay,
  viewerId,
  onClose,
  onChoose,
  onConfirm,
  onFeedback,
  preview = true,
  canModerate = false,
  busy = false,
  error,
}: {
  overlay: SocialOverlay;
  viewerId: string;
  onClose: () => void;
  onChoose: (next: SocialOverlay) => void;
  onConfirm: () => void;
  onFeedback: (body: string) => void;
  preview?: boolean;
  canModerate?: boolean;
  busy?: boolean;
  error?: string;
}) {
  const { t } = useI18n();
  const [body, setBody] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useSocialModal(ref, onClose);
  const isHide = overlay.kind === 'remove' && overlay.post.source === 'slack';
  const title =
    overlay.kind === 'discard'
      ? t('social.discard_title')
      : overlay.kind === 'reset'
        ? t('social.preview_reset_title')
        : overlay.kind === 'info'
          ? t('social.info')
          : overlay.kind === 'feedback'
            ? t('social.feedback_title')
            : overlay.kind === 'remove'
              ? t(isHide ? 'social.hide_title' : 'social.delete_title')
              : t('social.menu_label');
  return (
    <Sheet open label={title} closeLabel={t('social.close')} onClose={onClose}>
      <div ref={ref}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {error && (
          <p className={styles.danger} role="alert">
            {error}
          </p>
        )}
        {overlay.kind === 'menu' ? (
          <div className={styles.menu}>
            {overlay.post.sourceUrl && (
              <a href={overlay.post.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="social-link" size={24} />
                {t('social.original')}
              </a>
            )}
            {overlay.post.author.id === viewerId || canModerate ? (
              <button
                className={overlay.post.source === 'native' ? styles.danger : ''}
                onClick={() => onChoose({ kind: 'remove', post: overlay.post })}
              >
                <Icon name="social-delete" size={24} />
                {t(overlay.post.source === 'slack' ? 'social.hide' : 'social.delete')}
              </button>
            ) : (
              <button onClick={() => onChoose({ kind: 'feedback', post: overlay.post })}>
                <Icon name="information" size={24} />
                {t('social.feedback')}
              </button>
            )}
          </div>
        ) : overlay.kind === 'info' ? (
          <p className={styles.body}>{t(preview ? 'social.info_body' : 'social.live_info_body')}</p>
        ) : overlay.kind === 'feedback' ? (
          <>
            <p className={styles.meta}>{t(preview ? 'social.feedback_hint' : 'social.live_feedback_hint')}</p>
            <textarea
              className={styles.editor}
              value={body}
              maxLength={500}
              onChange={(e) => setBody(e.target.value)}
              aria-label={t('social.feedback_hint')}
            />
            <Button block disabled={busy || !body.trim()} onClick={() => onFeedback(body.trim())}>
              {t(busy ? 'social.saving' : 'social.send')}
            </Button>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>
              {t(
                overlay.kind === 'discard'
                  ? 'social.discard_body'
                  : overlay.kind === 'reset'
                    ? 'social.preview_reset_body'
                    : isHide
                      ? 'social.hide_body'
                      : 'social.delete_body',
              )}
            </p>
            <div className={styles.dialogActions}>
              <Button
                block
                className={overlay.kind === 'remove' && !isHide ? styles.dangerCta : undefined}
                onClick={onConfirm}
                disabled={busy}
              >
                {t(
                  overlay.kind === 'discard'
                    ? 'social.discard'
                    : overlay.kind === 'reset'
                      ? 'social.preview_reset_confirm'
                      : isHide
                        ? 'social.hide'
                        : 'social.delete',
                )}
              </Button>
              <Button block variant="secondary" onClick={onClose} disabled={busy}>
                {t(overlay.kind === 'discard' ? 'social.keep_editing' : 'social.keep')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
