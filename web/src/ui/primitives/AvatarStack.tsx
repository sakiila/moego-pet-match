import type { CSSProperties } from 'react';
import { Avatar } from './Avatar';
import styles from './AvatarStack.module.css';

export interface AvatarStackPerson {
  name: string;
  seed: string;
  src?: string | null;
}

export interface AvatarStackProps {
  /** 要叠放的人，按显示顺序。 */
  people: AvatarStackPerson[];
  /** 总人数；多于 people 时末尾显示「+剩余」。 */
  total: number;
  /** 「+剩余」标记的朗读文本。 */
  moreLabel?: (rest: number) => string;
  size?: number;
}

/** 头像叠放：左边的压住右边的边，超出部分收成「+N」垫在最底下。 */
export function AvatarStack({ people, total, moreLabel, size = 28 }: AvatarStackProps) {
  const rest = total - people.length;
  return (
    <span className={styles.stack} style={{ '--size': `${size}px` } as CSSProperties}>
      {people.map((p, i) => (
        <span key={p.seed} className={styles.item} style={{ zIndex: people.length - i }}>
          <Avatar name={p.name} seed={p.seed} src={p.src} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span className={`${styles.item} ${styles.more}`} role="img" aria-label={moreLabel?.(rest) ?? `+${rest}`}>
          +{rest}
        </span>
      )}
    </span>
  );
}
