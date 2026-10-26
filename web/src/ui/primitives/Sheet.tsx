import { useEffect, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  /** 无障碍名称（弹层不一定有可见标题）。 */
  label: string;
  closeLabel: string;
  closeIcon?: IconName;
  onClose: () => void;
  /** 左上角的小标记，如「已收集」。 */
  badge?: ReactNode;
  children: ReactNode;
  /** 陈列页内联展示，不铺满视口。 */
  inline?: boolean;
  /** 上方有详情卡时保留内容和滚动，但暂停名片交互及 Escape。 */
  suspended?: boolean;
  aboveDetail?: boolean;
  trapFocus?: boolean;
  returnFocus?: HTMLElement | null;
}

/** 底部抽屉：带关闭按钮，点背景或 Esc 关闭；内容超高时在抽屉内滚动。 */
export function Sheet({ open, label, closeLabel, closeIcon = 'close', onClose, badge, children, inline, suspended = false, aboveDetail = false, trapFocus = false, returnFocus }: SheetProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || suspended || inline || !trapFocus) return;
    const previous = returnFocus ?? document.activeElement;
    const node = root.current;
    node?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !node) return;
      const controls = [...node.querySelectorAll<HTMLElement>('button:not(:disabled),[href],[tabindex="0"]')]
        .filter(el => !el.closest('[inert]') && el.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (first && last && (!node.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last))) {
        event.preventDefault(); (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', trap, true);
    return () => {
      document.removeEventListener('keydown', trap, true);
      queueMicrotask(() => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); });
    };
  }, [open, suspended, inline, trapFocus, returnFocus]);
  useEffect(() => {
    if (!open || suspended) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, suspended]);

  if (!open) return null;
  return (
    <div ref={root} className={`${styles.backdrop} ${inline ? styles.inline : ''} ${aboveDetail ? styles.aboveDetail : ''}`} onClick={onClose} inert={suspended || undefined} aria-hidden={suspended || undefined}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className={styles.bar}>
          {badge}
          <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>
            <Icon name={closeIcon} size={20} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
