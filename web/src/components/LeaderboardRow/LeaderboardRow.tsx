import type { LeaderboardEntry } from '../../api/types';
import { useI18n, type MessageKey } from '../../i18n';
import { RankMark } from '../RankMark/RankMark';
import styles from './LeaderboardRow.module.css';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';

export interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isMe: boolean;
  tied: boolean;
  onSelect?: (entry: LeaderboardEntry) => void;
  titleRevealed?: boolean;
}

/** 一行名次：自己高亮；同分时标出「同分并列」。 */
export function LeaderboardRow({ entry, isMe, tied, onSelect, titleRevealed = false }: LeaderboardRowProps) {
  const { t, locale } = useI18n();
  const content = <>
      <span className={styles.rank}>
        <RankMark rank={entry.rank} size={40} />
      </span>
      <span className={styles.avatar}><AchievementAvatar name={entry.name} seed={entry.userId} src={`/img/avatars/${encodeURIComponent(entry.userId)}`} equippedTitle={entry.equippedTitle} revealed={titleRevealed || isMe} /></span>
      <span className={styles.name}>
        {entry.name}
      </span>
      <span className={styles.score}>{entry.score.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
      {tied && <span className={styles.meta}>
        <span className={styles.tied}>{t('leaderboard.tied_rank')}</span>
      </span>}
  </>;
  const className = `${styles.row} ${isMe ? styles.me : ''} ${onSelect ? styles.interactive : ''}`;
  return onSelect ? <button type="button" className={className} data-me={isMe || undefined}
    aria-label={t('profile.open', {playerName:entry.name})} onClick={() => onSelect(entry)}>{content}</button>
    : <div className={className} data-me={isMe || undefined}>{content}</div>;
}

/** 列表表头：名次 / 同事 / 最好成绩（今日榜为「今日最好」），列宽与 LeaderboardRow 一致。 */
export function LeaderboardHeader({ scoreLabel = 'leaderboard.best_score' }: { scoreLabel?: MessageKey }) {
  const { t } = useI18n();
  return (
    <div className={`${styles.row} ${styles.header}`} aria-hidden>
      <span className={styles.rank}>{t('leaderboard.rank')}</span>
      <span className={styles.colleague}>{t('leaderboard.colleague')}</span>
      <span className={styles.score}>{t(scoreLabel)}</span>
    </div>
  );
}
