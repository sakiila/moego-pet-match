import type { LeaderboardEntry } from '../../api/types';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import styles from './Podium.module.css';

/** 领先三位：按真实名次显示（并列时可能出现两个第 2 名），布局为 2 · 1 · 3。 */
export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const { locale } = useI18n();
  const top = entries.slice(0, 3);
  if (top.length === 0) return null;
  const order = [top[1], top[0], top[2]];
  return (
    <div className={styles.podium}>
      {order.map((e, i) =>
        e ? (
          <div key={e.userId} className={`${styles.place} ${i === 1 ? styles.first : ''}`}>
            <span className={styles.crown}>👑 {e.rank}</span>
            <Avatar name={e.name} seed={e.userId} src={`/img/avatars/${encodeURIComponent(e.userId)}`} size={i === 1 ? 64 : 52} />
            <span className={styles.name}>{e.name}</span>
            <span className={styles.score}>{e.score.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
          </div>
        ) : (
          <div key={`empty-${i}`} />
        ),
      )}
    </div>
  );
}
