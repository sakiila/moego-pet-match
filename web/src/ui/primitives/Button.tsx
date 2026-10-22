import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  block?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', block, icon, className, children, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], size === 'lg' && styles.large, block && styles.block, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
