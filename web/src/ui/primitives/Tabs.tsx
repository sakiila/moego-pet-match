import styles from './Tabs.module.css';

export interface TabsProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  variant?: 'pill' | 'underline';
  label: string;
}

export function Tabs<T extends string>({ value, options, onChange, variant = 'pill', label }: TabsProps<T>) {
  return (
    <div className={styles[variant]} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
