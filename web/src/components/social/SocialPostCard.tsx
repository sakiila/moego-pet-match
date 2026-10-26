import { useI18n } from '../../i18n';
import { socialDate } from '../../social/dates';
import type { ReactionKind, SocialPost } from '../../social/model';
import { Avatar } from '../../ui/primitives/Avatar';
import { Icon } from '../../ui/primitives/Icon';
import { SocialReactions } from './SocialReactions';
import styles from './Social.module.css';

export interface SocialPostCardProps {
  post: SocialPost;
  viewerId: string;
  detail?: boolean;
  busy?: boolean;
  onOpen: () => void;
  onPhoto: (index: number) => void;
  onMenu: () => void;
  onReaction: (kind: ReactionKind, selected: boolean) => void;
  /** 留言入口：列表进入详情，详情定位输入栏。 */
  onComments: () => void;
}
export function SocialPostCard({
  post,
  viewerId,
  detail,
  busy,
  onOpen,
  onPhoto,
  onMenu,
  onReaction,
  onComments,
}: SocialPostCardProps) {
  const { t, locale } = useI18n();
  const first = post.photos[0];
  return (
    <article className={styles.post} aria-label={t('social.author', { name: post.author.name })}>
      <div className={styles.authorRow}>
        <Avatar name={post.author.name} src={post.author.avatarSrc} seed={post.author.id} size={36} />
        <div className={styles.authorText}>
          <strong className={styles.name}>{post.author.name}</strong>
          <span className={styles.meta}>
            {socialDate(post.createdAt, locale, t('social.today'), t('social.yesterday'))}
            {post.source === 'slack' ? ` · ${t('social.from_slack')}` : ''}
          </span>
        </div>
        {!detail && (
          <button type="button" className={styles.iconButton} aria-label={t('social.more')} onClick={onMenu}>
            <Icon name="social-more" size={23} />
          </button>
        )}
      </div>
      {post.body &&
        (detail ? (
          <p className={styles.body}>{post.body}</p>
        ) : (
          <button className={styles.bodyButton} onClick={onOpen}>
            <p className={`${styles.body} ${styles.bodyPreview}`}>{post.body}</p>
          </button>
        ))}
      {first && (
        <button
          type="button"
          className={styles.photoButton}
          onClick={() => onPhoto(0)}
          aria-label={t('social.view_photo', { index: 1, count: post.photos.length })}
        >
          <img
            className={`${styles.postPhoto} ${detail ? styles.detailPhoto : ''}`}
            src={first.src}
            alt={first.alt || t('social.photo_alt', { name: post.author.name, index: 1 })}
            loading="lazy"
          />
          {post.photos.length > 1 && (
            <span className={styles.photoCounter}>
              {t('social.photo_count', { index: 1, count: post.photos.length })}
            </span>
          )}
        </button>
      )}
      {post.source === 'slack' && post.sourceUrl && (
        <p className={styles.sourceLine}>
          {!detail && <span>{t('social.source_channel')} · </span>}
          <a className={styles.source} href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
            {t(detail ? 'social.original' : 'social.view_original')}
            <Icon name="social-link" size={14} />
          </a>
        </p>
      )}
      {post.pet && (
        <span className={styles.petTag}>
          {post.pet.stickerSrc && <img src={post.pet.stickerSrc} width={24} height={24} alt="" />}
          {post.pet.name}
        </span>
      )}
      <SocialReactions
        reactions={post.reactions}
        counts={post.reactionCounts}
        disabled={busy}
        viewerId={viewerId}
        onReaction={onReaction}
        commentCount={post.commentCount ?? post.comments.length}
        onComments={onComments}
      />
    </article>
  );
}
