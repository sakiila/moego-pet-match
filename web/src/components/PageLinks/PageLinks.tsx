import styles from './PageLinks.module.css';

export interface PageLink {
  label: string;
  /** 外部链接（新标签页打开）；与 onClick 二选一。 */
  href?: string;
  /** 读屏名称，默认用 label。 */
  ariaLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  testId?: string;
}

/**
 * 页尾的一排轻量文字链接（信息使用说明 | 资料删除申请 | 设置）。
 * compact：首页页尾用的小字版，链接间用「·」隔开，点按高度仍为 44px。
 */
export function PageLinks({ links, compact = false }: { links: PageLink[]; compact?: boolean }) {
  return (
    <nav className={`${styles.row} ${compact ? styles.compact : ''}`}>
      {links.map((l, i) => (
        <span key={l.label} className={styles.item}>
          {compact && i > 0 && <span className={styles.dot} aria-hidden="true">·</span>}
          {l.href ? (
            <a className={styles.link} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.ariaLabel} data-testid={l.testId}>
              {l.label}
            </a>
          ) : (
            <button type="button" className={styles.link} onClick={l.onClick} disabled={l.disabled} aria-label={l.ariaLabel} data-testid={l.testId}>
              {l.label}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}
