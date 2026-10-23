import { useEffect, type ReactNode } from 'react';
import styles from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  /** 无障碍名称（弹层不一定有可见标题）。 */
  label: string;
  closeLabel: string;
  onClose: () => void;
  /** 左上角的小标记，如「已收集」。 */
  badge?: ReactNode;
  children: ReactNode;
  /** 陈列页内联展示，不铺满视口。 */
  inline?: boolean;
}

/** 底部抽屉：带关闭按钮，点背景或 Esc 关闭；内容超高时在抽屉内滚动。 */
export function Sheet({ open, label, closeLabel, onClose, badge, children, inline }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={`${styles.backdrop} ${inline ? styles.inline : ''}`} onClick={onClose}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className={styles.bar}>
          {badge}
          <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
