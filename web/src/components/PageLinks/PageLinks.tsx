import styles from './PageLinks.module.css';

export interface PageLink {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}

/** 页尾的一排轻量文字链接（信息使用说明 | 资料删除申请 | 设置）。 */
export function PageLinks({ links }: { links: PageLink[] }) {
  return (
    <nav className={styles.row}>
      {links.map((l) => (
        <button key={l.label} type="button" className={styles.link} onClick={l.onClick} disabled={l.disabled} data-testid={l.testId}>
          {l.label}
        </button>
      ))}
    </nav>
  );
}
