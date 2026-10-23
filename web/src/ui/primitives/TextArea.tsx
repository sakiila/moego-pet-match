import { useId, type TextareaHTMLAttributes } from 'react';
import styles from './TextField.module.css';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** 带标签的多行输入框（如删除申请的补充说明），与 TextField 同一外观。 */
export function TextArea({ label, value, onChange, rows = 4, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className={`${styles.input} ${styles.area}`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}
