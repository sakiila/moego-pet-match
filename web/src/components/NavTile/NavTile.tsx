import { Icon, type IconName } from '../../ui/primitives/Icon';
import styles from './NavTile.module.css';

/** 次级入口（门店：图鉴、排行榜、我的宠物；报告页另含回门店）。相邻入口之间有细分隔线（图稿 home-entry-icons-v3）。 */
export function NavTile({ icon, label, onClick, unread = false, unreadLabel }: { icon: IconName; label: string; onClick: () => void; unread?: boolean; unreadLabel?: string }) {
  return (
    <button type="button" className={styles.tile} onClick={onClick} aria-label={unread && unreadLabel ? `${label} · ${unreadLabel}` : undefined}>
      <span className={styles.iconFrame} data-icon={icon} data-unread={unread || undefined}>
        <Icon name={icon} size={52} className={styles.icon} />
      </span>
      {label}
    </button>
  );
}
