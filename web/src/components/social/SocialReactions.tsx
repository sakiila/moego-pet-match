import { useI18n } from '../../i18n';
import { REACTION_KINDS, type ReactionKind, type SocialPost } from '../../social/model';
import { Icon } from '../../ui/primitives/Icon';
import styles from './Social.module.css';

/** 四种快捷互动沿用宠物小动作原稿；顺序固定。 */
export const REACTION_ICONS = {
  cute: 'paw-cute',
  pets: 'paw-pets',
  play: 'paw-play',
  love: 'paw-love',
} as const satisfies Record<ReactionKind, string>;

export interface SocialReactionsProps {
  reactions: SocialPost['reactions'];
  counts?: SocialPost['reactionCounts'];
  viewerId: string;
  commentCount?: number;
  disabled?: boolean;
  onReaction: (kind: ReactionKind, selected: boolean) => void;
  /** 列表进入详情，详情定位到留言输入。 */
  onComments: () => void;
}
export function SocialReactions({
  reactions,
  counts,
  viewerId,
  commentCount = 0,
  disabled,
  onReaction,
  onComments,
}: SocialReactionsProps) {
  const { t, locale } = useI18n();
  const compact = (n: number) => new Intl.NumberFormat(locale, { notation: 'compact' }).format(n);
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
            title={t(`social.${kind}`)}
            aria-label={t('social.reaction_label', {
              reaction: t(`social.${kind}`),
              count,
              state: t(selected ? 'social.selected' : 'social.unselected'),
            })}
            onClick={() => onReaction(kind, !selected)}
          >
            <Icon name={REACTION_ICONS[kind]} size={30} />
            <span aria-hidden>{compact(count)}</span>
            {selected && (
              <span className={styles.reactionCheck}>
                <Icon name="selected-check" size={10} />
              </span>
            )}
          </button>
        );
      })}
      <span className={styles.reactionDivider} aria-hidden />
      <button
        type="button"
        className={styles.reaction}
        title={t('social.comments_title')}
        aria-label={t('social.comments_label', { count: commentCount })}
        onClick={onComments}
      >
        <Icon name="social-comment" size={30} />
        <span aria-hidden>{compact(commentCount)}</span>
      </button>
    </div>
  );
}
