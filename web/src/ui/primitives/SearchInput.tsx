import type { InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import styles from './SearchInput.module.css';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  clearLabel: string;
  /** 正在搜索：右侧显示转圈；输入框保持可输入。 */
  loading?: boolean;
}

export function SearchInput({ value, onChange, clearLabel, loading = false, ...rest }: SearchInputProps) {
  return (
    <label className={styles.field}>
      <Icon name="search" size={24} />
      <input className={styles.input} type="search" value={value} onChange={(e) => onChange(e.target.value)} aria-busy={loading || undefined} {...rest} />
      {loading && <span className={styles.spinner} role="status" data-testid="search-loading" />}
      {value && (
        <button type="button" className={styles.clear} aria-label={clearLabel} onClick={() => onChange('')}>
          <Icon name="close" size={14} />
        </button>
      )}
    </label>
  );
}
