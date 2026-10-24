import { Icon, type IconName } from '../../ui/primitives/Icon';
import styles from './RankMark.module.css';

const BADGE: Record<number, { icon: IconName; scale: number }> = {
  1: { icon: 'rank-1', scale: 1 },
  2: { icon: 'rank-2', scale: 0.84 },
  3: { icon: 'rank-3', scale: 0.72 },
};

/**
 * 名次标识（leaderboard-marks-original-v1）：前三名按实际名次用皇冠／盾牌／六角章，
 * 第 1 名最大、依次递减；并列时同名次共用同一徽记（如两个第 2 名），其后为普通数字。
 * size 为第 1 名徽记的高度。
 */
export function RankMark({ rank, size = 40 }: { rank: number; size?: number }) {
  const badge = BADGE[rank];
  if (badge) return <Icon name={badge.icon} size={Math.round(size * badge.scale)} label={String(rank)} />;
  return (
    <span className={styles.number} style={{ minWidth: size }}>
      {rank}
    </span>
  );
}
