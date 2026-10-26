import { useEffect, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from '../../ui/primitives/Icon';
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
  /** 临时引导浮层，显示在链接行上方，尖角指向此入口。 */
  hint?: { id: string; content: ReactNode };
  icon?: IconName;
}

/**
 * 页尾的一排轻量文字链接（信息使用说明 | 资料删除申请 | 设置）。
 * compact：首页页尾用的小字版，链接间用「·」隔开，点按高度仍为 44px。
 */
export function PageLinks({ links, compact = false }: { links: PageLink[]; compact?: boolean }) {
  const rowRef = useRef<HTMLElement>(null);
  const hintedLink = links.find((link) => link.hint);
  const hintId = hintedLink?.hint?.id;
  const hintLabel = hintedLink?.label;
  useEffect(() => {
    const row = rowRef.current;
    if (!hintId || !row) return;
    const reveal = () => row.scrollIntoView({ block: 'nearest' });
    reveal();
    // 店长与字体晚到、或切换语言改变页面高度后，提示目标仍应可见。
    const observer = new ResizeObserver(reveal);
    observer.observe(row.closest('main') ?? row);
    return () => observer.disconnect();
  }, [hintId, hintLabel]);
  return (
    <nav ref={rowRef} className={`${styles.row} ${compact ? styles.compact : ''}`}>
      {links.map((l, i) => (
        <div key={l.label} className={styles.item}>
          {compact && i > 0 && <span className={styles.dot} aria-hidden="true">·</span>}
          {l.href ? (
            <a className={styles.link} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.ariaLabel} data-testid={l.testId}>
              {l.label}
            </a>
          ) : (
            <button type="button" className={`${styles.link} ${l.hint ? styles.highlighted : ''}`} onClick={l.onClick} disabled={l.disabled} aria-label={l.ariaLabel} aria-describedby={l.hint?.id} data-testid={l.testId}>
              {l.icon && <Icon name={l.icon} size={20} />}
              {l.label}
            </button>
          )}
          {l.hint && <div className={styles.hint} id={l.hint.id}>{l.hint.content}</div>}
        </div>
      ))}
    </nav>
  );
}
