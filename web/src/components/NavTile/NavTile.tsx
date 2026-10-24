import { Icon, type IconName } from '../../ui/primitives/Icon';
import styles from './NavTile.module.css';

/** 次级入口（门店：图鉴、排行榜、我的宠物；报告页另含回门店）。相邻入口之间有细分隔线（图稿 home-entry-icons-v3）。 */
export function NavTile({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.tile} onClick={onClick}>
      <span className={styles.iconFrame} data-icon={icon}>
        <Icon name={icon} size={52} className={styles.icon} />
      </span>
      {label}
    </button>
  );
}
