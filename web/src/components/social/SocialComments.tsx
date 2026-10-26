import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { socialDate } from '../../social/dates';
import { MAX_COMMENT_LENGTH, type SocialComment, type SocialPerson } from '../../social/model';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';
import { Icon } from '../../ui/primitives/Icon';
import styles from './Social.module.css';

export function SocialComments({
  id,
  comments,
  total,
  viewerId,
  replyTo,
  onReply,
  onDelete,
  onAuthor,
}: {
  id?: string;
  comments: SocialComment[];
  total?: number;
  viewerId: string;
  replyTo?: SocialPerson;
  onReply: (person: SocialPerson) => void;
  onDelete: (id: string) => void;
  onAuthor?: (person: SocialPerson) => void;
}) {
  const { t, locale } = useI18n();
  const count = total ?? comments.length;
  return (
    <section id={id} aria-label={t('social.comment_count', { count })}>
      <h2 className={styles.sectionTitle}>{t('social.comment_count', { count })}</h2>
      {!comments.length && <p className={styles.meta}>{t('social.no_comments')}</p>}
      {comments.map((comment) => (
        <article className={styles.comment} key={comment.id} id={`comment-${comment.id}`}>
          {onAuthor ? (
            <button
              type="button"
              className={styles.avatarButton}
              aria-label={t('social.open_profile', { name: comment.author.name })}
              onClick={() => onAuthor(comment.author)}
            >
              <AchievementAvatar name={comment.author.name} src={comment.author.avatarSrc} seed={comment.author.id} equippedTitle={comment.author.title} />
            </button>
          ) : (
            <AchievementAvatar name={comment.author.name} src={comment.author.avatarSrc} seed={comment.author.id} equippedTitle={comment.author.title} />
          )}
          <div className={styles.commentContent}>
            <strong className={styles.name}>{comment.author.name}</strong>
            {comment.replyTo && (
              <span className={styles.replyTarget}>{t('social.replying', { name: comment.replyTo.name })}</span>
            )}
            <p>{comment.body}</p>
            <div className={styles.commentTools}>
              <time dateTime={comment.createdAt}>
                {socialDate(comment.createdAt, locale, t('social.today'), t('social.yesterday'))}
              </time>
              {comment.source === 'slack' && <span>{t('social.from_slack')}</span>}
              <button aria-pressed={replyTo?.id === comment.author.id} onClick={() => onReply(comment.author)}>
                {t('social.reply')}
              </button>
              {comment.author.id === viewerId && comment.source !== 'slack' && (
                <button onClick={() => onDelete(comment.id)} aria-label={t('social.delete_comment')}>
                  <Icon name="social-delete" size={15} />
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
/** 详情页留言按钮定位的输入框。 */
export const SOCIAL_COMMENT_INPUT = 'social-comment-input';
export function SocialCommentInput({
  replyTo,
  onCancelReply,
  onSend,
}: {
  replyTo?: SocialPerson;
  onCancelReply: () => void;
  onSend: (body: string, id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const commentId = useRef(crypto.randomUUID());
  const [error, setError] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (replyTo) input.current?.focus();
  }, [replyTo]);
  const submit = async () => {
    if (!body.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await onSend(body.trim(), commentId.current);
      setBody('');
      commentId.current = crypto.randomUUID();
      input.current?.focus();
    } catch {
      setError(t('social.action_failed'));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <div className={styles.commentDock}>
      {replyTo && (
        <div className={styles.replyBanner}>
          <span className={styles.replyTarget}>{t('social.replying', { name: replyTo.name })}</span>
          <button className={styles.textButton} onClick={onCancelReply}>
            {t('social.reply_cancel')}
          </button>
        </div>
      )}
      <p>{t('social.comment_local')}</p>
      {error && (
        <p className={styles.danger} role="alert">
          {error}
        </p>
      )}
      <form
        className={styles.commentInputRow}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <textarea
          ref={input}
          id={SOCIAL_COMMENT_INPUT}
          rows={1}
          maxLength={MAX_COMMENT_LENGTH}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('social.comment_placeholder')}
          aria-label={t('social.comment_placeholder')}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <button className={styles.send} type="submit" disabled={busy || !body.trim()} aria-label={t('social.send')}>
          <Icon name="social-send" size={25} />
        </button>
      </form>
    </div>
  );
}
