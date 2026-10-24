import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  block?: boolean;
  /** 文字前的自定义内容（如鱼关单鱼贴纸）。 */
  icon?: ReactNode;
  /** 文字前的图标库图标，尺寸随按钮大小；橙底主按钮用白色版本（如 open-shop-white）。 */
  iconName?: IconName;
}

export function Button({ variant = 'primary', size = 'md', block, icon, iconName, className, children, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], size === 'lg' && styles.large, block && styles.block, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} {...rest}>
      {/* 图标与文字同一行内排：长文案折行时整体居中，图标跟在首行前 */}
      <span className={styles.label}>
        {(iconName || icon) && <span className={styles.icon}>{iconName ? <Icon name={iconName} size={size === 'lg' ? 32 : 22} /> : icon}</span>}
        {children}
      </span>
    </button>
  );
}
