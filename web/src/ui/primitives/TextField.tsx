import { useId, type InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 字段下方的错误提示；有值时字段标红。 */
  error?: string | null;
}

/** 带标签的单行输入框；标签与错误提示都由调用方传入文案。 */
export function TextField({ label, value, onChange, error, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        data-invalid={!!error}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
