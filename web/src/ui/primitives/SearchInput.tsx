import type { InputHTMLAttributes } from 'react';
import styles from './SearchInput.module.css';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  clearLabel: string;
}

export function SearchInput({ value, onChange, clearLabel, ...rest }: SearchInputProps) {
  return (
    <label className={styles.field}>
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden>
        <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <input className={styles.input} type="search" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      {value && (
        <button type="button" className={styles.clear} aria-label={clearLabel} onClick={() => onChange('')}>
          ✕
        </button>
      )}
    </label>
  );
}
