import { useI18n } from '../../i18n';
import { REACTION_KINDS, type ReactionKind, type SocialPost } from '../../social/model';
import { Icon } from '../../ui/primitives/Icon';
import styles from './Social.module.css';

export interface SocialReactionsProps {
  reactions: SocialPost['reactions'];
  counts?: SocialPost['reactionCounts'];
  viewerId: string;
  commentCount?: number;
  disabled?: boolean;
  onReaction: (kind: ReactionKind, selected: boolean) => void;
  onComments?: () => void;
}
export function SocialReactions({
  reactions,
  counts,
  viewerId,
  commentCount,
  disabled,
  onReaction,
  onComments,
}: SocialReactionsProps) {
  const { t } = useI18n();
  return (
    <div className={styles.reactionBar}>
      {REACTION_KINDS.map((kind) => {
        const selected = reactions[kind].includes(viewerId);
        const count = counts?.[kind] ?? reactions[kind].length;
        return (
          <button
            key={kind}
            type="button"
            className={styles.reaction}
            aria-pressed={selected}
            disabled={disabled}
            aria-label={t('social.reaction_label', {
              reaction: t(`social.${kind}`),
              count,
              state: t(selected ? 'social.selected' : 'social.unselected'),
            })}
            onClick={() => onReaction(kind, !selected)}
          >
            <Icon name={kind === 'paw' ? 'open-shop' : `social-${kind}`} size={24} />
            <span>{count}</span>
            {selected && (
              <span className={styles.reactionCheck}>
                <Icon name="selected-check" size={10} />
              </span>
            )}
          </button>
        );
      })}
      {onComments && (
        <button type="button" className={`${styles.reaction} ${styles.commentsButton}`} onClick={onComments}>
          <Icon name="social-comment" size={23} />
          <span>{t('social.comment_count', { count: commentCount ?? 0 })}</span>
        </button>
      )}
    </div>
  );
}
