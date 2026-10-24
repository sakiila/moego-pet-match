import { useState, type CSSProperties } from 'react';
import { petImage, type PetInfo } from '../../game/pets';
import styles from './PetTile.module.css';

export interface PetTileProps {
  pet: PetInfo;
  /** 本局 kind 下标，决定辅助底色。 */
  tint: number;
  size?: number;
  /** 阵容头像直接放在浅色卡片上，不再套一层棋格。 */
  variant?: 'tile' | 'portrait';
}

/** 宠物头像 + 本局固定浅底色；棋格内不放名字。贴纸加载失败时回退占位。 */
export function PetTile({ pet, tint, size, variant = 'tile' }: PetTileProps) {
  const [failed, setFailed] = useState(false);
  const style = { '--tint': `var(--pet-tint-${tint % 6})`, '--size': size ? `${size}px` : undefined } as CSSProperties;
  const src = petImage(pet, size && size > 96 ? 512 : 128);
  return (
    <div className={styles.tile} data-variant={variant} style={style} role="img" aria-label={pet.name}>
      {src && !failed ? (
        <img className={styles.sticker} src={src} alt="" draggable={false} onError={() => setFailed(true)} />
      ) : (
        <span className={styles.face} aria-hidden>
          {pet.emoji}
        </span>
      )}
    </div>
  );
}
