import { useState, type CSSProperties } from 'react';
import styles from './Avatar.module.css';

const PALETTE = ['var(--color-brand)', 'var(--color-cat-blue)', 'var(--color-dog-red)', 'var(--color-success)', '#8a6cd1', '#d18a2e'];

function colorFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** 取名字首个可见字符；中文名取第一个汉字。 */
export function initialOf(name: string) {
  const first = [...name.trim()][0] ?? '?';
  return first.toUpperCase();
}

export interface AvatarProps {
  name: string;
  /** 头像图片地址；缺失或加载失败时回退到彩色首字母。 */
  src?: string | null;
  size?: number;
  /** 决定回退底色的稳定标识（如 userId），缺省用名字。 */
  seed?: string;
}

export function Avatar({ name, src, size = 48, seed }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const style = { '--size': `${size}px`, '--avatar-bg': colorFor(seed ?? name) } as CSSProperties;
  return (
    <span className={styles.avatar} style={style} role="img" aria-label={name}>
      {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : initialOf(name)}
    </span>
  );
}
