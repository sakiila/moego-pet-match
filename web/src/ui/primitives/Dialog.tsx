import { useEffect, type ReactNode } from 'react';
import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  /** 陈列页内联展示，不铺满视口。 */
  inline?: boolean;
}

/** 底部弹层。打开不暂停游戏，由调用方决定计时规则。 */
export function Dialog({ open, title, children, actions, onClose, inline }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={`${styles.backdrop} ${inline ? styles.inline : ''}`} onClick={onClose}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        {children && <div className={styles.body}>{children}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
