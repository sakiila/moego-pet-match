import { useI18n } from '../../i18n';
import { socialDate } from '../../social/dates';
import type { ReactionKind, SocialPerson, SocialPost } from '../../social/model';
import { Icon } from '../../ui/primitives/Icon';
import { SocialAuthor } from './SocialAuthor';
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
  /** 点头像或名字查看玩家卡片。 */
  onAuthor?: (person: SocialPerson) => void;
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
  onAuthor,
}: SocialPostCardProps) {
  const { t, locale } = useI18n();
  // 列表只放首张，详情按原比例逐张展示。
  const shown = detail ? post.photos : post.photos.slice(0, 1);
  return (
    <article className={styles.post} aria-label={t('social.author', { name: post.author.name })}>
      <div className={styles.authorRow}>
        <SocialAuthor person={post.author} size={36} onOpen={onAuthor}>
          <span className={styles.meta}>
            {socialDate(post.createdAt, locale, t('social.today'), t('social.yesterday'))}
            {post.source === 'slack' ? ` · ${t('social.from_slack')}` : ''}
          </span>
        </SocialAuthor>
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
      {shown.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          className={styles.photoButton}
          onClick={() => onPhoto(index)}
          aria-label={t('social.view_photo', { index: index + 1, count: post.photos.length })}
        >
          <img
            className={styles.postPhoto}
            src={photo.src}
            alt={photo.alt || t('social.photo_alt', { name: post.author.name, index: index + 1 })}
            loading="lazy"
          />
          {!detail && post.photos.length > 1 && (
            <span className={styles.photoCounter}>
              {t('social.photo_count', { index: 1, count: post.photos.length })}
            </span>
          )}
        </button>
      ))}
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
