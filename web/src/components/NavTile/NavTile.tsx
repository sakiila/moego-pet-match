import styles from './NavTile.module.css';

/** 门店次级入口（图鉴、排行榜、我的宠物）。 */
export function NavTile({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.tile} onClick={onClick}>
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
      {label}
    </button>
  );
}
