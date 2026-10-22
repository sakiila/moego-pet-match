import type { LeaderboardEntry } from '../../api/types';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import styles from './LeaderboardRow.module.css';

export interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isMe: boolean;
  tied: boolean;
}

/** 一行名次：自己高亮；同分时标出「同分并列」。 */
export function LeaderboardRow({ entry, isMe, tied }: LeaderboardRowProps) {
  const { t, locale } = useI18n();
  return (
    <div className={`${styles.row} ${isMe ? styles.me : ''}`} data-me={isMe || undefined}>
      <span className={styles.rank}>{entry.rank}</span>
      <Avatar name={entry.name} seed={entry.userId} src={`/img/avatars/${encodeURIComponent(entry.userId)}`} size={40} />
      <span className={styles.name}>
        {entry.name}
        {tied && <span className={styles.tied}>{t('leaderboard.tied_rank')}</span>}
      </span>
      <span className={styles.score}>{entry.score.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
    </div>
  );
}
