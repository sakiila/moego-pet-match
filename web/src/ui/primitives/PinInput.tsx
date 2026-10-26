import { useId, useRef, useState, type ClipboardEvent, type MouseEvent } from 'react';
import styles from './PinInput.module.css';

export interface PinInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: 'new-password' | 'current-password';
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

const positions = [0, 1, 2, 3];
const digits = (text: string) => text.replace(/[^0-9]/g, '');

/** 四格只是视觉层；单个原生密码框保留数字键盘、粘贴、选择与键盘编辑。 */
export function PinInput({ label, value, onChange, autoComplete = 'current-password', autoFocus, disabled, invalid, describedBy }: PinInputProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState(value.length);

  const moveCaret = (position: number, selectDigit = false) => {
    const start = Math.min(position, value.length);
    input.current?.setSelectionRange(start, selectDigit && start < value.length ? start + 1 : start);
    setCaret(start);
  };

  const selectSlot = (event: MouseEvent<HTMLInputElement>) => {
    if (!event.detail) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const slot = Math.max(0, Math.min(3, Math.floor((event.clientX - bounds.left) / bounds.width * 4)));
    moveCaret(slot, true);
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = digits(event.clipboardData.getData('text'));
    if (!pasted) return;
    const start = event.currentTarget.selectionStart ?? value.length;
    const end = event.currentTarget.selectionEnd ?? start;
    const next = (pasted.length >= 4 ? pasted : value.slice(0, start) + pasted + value.slice(end)).slice(0, 4);
    const nextCaret = pasted.length >= 4 ? 4 : Math.min(start + pasted.length, 4);
    onChange(next);
    setCaret(nextCaret);
    queueMicrotask(() => input.current?.setSelectionRange(nextCaret, nextCaret));
  };

  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <span className={styles.control} data-disabled={disabled || undefined} data-invalid={invalid || undefined}>
        <input
          ref={input} id={id} className={styles.native} type="password" inputMode="numeric" pattern="[0-9]{4}"
          maxLength={4} required autoComplete={autoComplete} autoFocus={autoFocus} disabled={disabled}
          value={value} aria-invalid={invalid || undefined} aria-describedby={describedBy}
          onFocus={event => { setFocused(true); setCaret(event.currentTarget.selectionStart ?? value.length); }}
          onBlur={() => setFocused(false)} onClick={selectSlot} onPaste={paste}
          onSelect={event => setCaret(event.currentTarget.selectionStart ?? value.length)}
          onChange={event => {
            const next = digits(event.currentTarget.value).slice(0, 4);
            setCaret(Math.min(event.currentTarget.selectionStart ?? next.length, next.length));
            onChange(next);
          }}
        />
        <span className={styles.slots} aria-hidden="true">
          {positions.map(position => <span key={position} className={styles.slot}
            data-filled={position < value.length || undefined}
            data-active={focused && !disabled && position === Math.min(caret, 3) || undefined}
          />)}
        </span>
      </span>
    </label>
  );
}
