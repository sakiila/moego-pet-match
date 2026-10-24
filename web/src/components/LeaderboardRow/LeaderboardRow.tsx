import type { LeaderboardEntry } from '../../api/types';
import { useI18n } from '../../i18n';
import { RankMark } from '../RankMark/RankMark';
import styles from './LeaderboardRow.module.css';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';

export interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isMe: boolean;
  tied: boolean;
}

/** 一行名次：自己高亮并标「你」；同分时标出「同分并列」。 */
export function LeaderboardRow({ entry, isMe, tied }: LeaderboardRowProps) {
  const { t, locale } = useI18n();
  return (
    <div className={`${styles.row} ${isMe ? styles.me : ''}`} data-me={isMe || undefined}>
      <span className={styles.rank}>
        <RankMark rank={entry.rank} size={40} />
      </span>
      <span className={styles.avatar}><AchievementAvatar name={entry.name} seed={entry.userId} src={`/img/avatars/${encodeURIComponent(entry.userId)}`} equippedTitle={entry.equippedTitle} /></span>
      <span className={styles.name}>
        {entry.name}
      </span>
      <span className={styles.score}>{entry.score.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
      {(isMe || tied) && <span className={styles.meta}>
        {isMe && <span className={styles.you}>{t('leaderboard.you')}</span>}
        {tied && <span className={styles.tied}>{t('leaderboard.tied_rank')}</span>}
      </span>}
    </div>
  );
}

/** 列表表头：名次 / 同事 / 最好成绩，列宽与 LeaderboardRow 一致。 */
export function LeaderboardHeader() {
  const { t } = useI18n();
  return (
    <div className={`${styles.row} ${styles.header}`} aria-hidden>
      <span className={styles.rank}>{t('leaderboard.rank')}</span>
      <span className={styles.colleague}>{t('leaderboard.colleague')}</span>
      <span className={styles.score}>{t('leaderboard.best_score')}</span>
    </div>
  );
}
