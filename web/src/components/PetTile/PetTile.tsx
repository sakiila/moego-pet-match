import type { CSSProperties } from 'react';
import type { PetInfo } from '../../game/pets';
import styles from './PetTile.module.css';

export interface PetTileProps {
  pet: PetInfo;
  /** 本局 kind 下标，决定辅助底色。 */
  tint: number;
  size?: number;
}

/** 宠物头像 + 本局固定浅底色；棋格内不放名字。 */
export function PetTile({ pet, tint, size }: PetTileProps) {
  const style = { '--tint': `var(--pet-tint-${tint % 6})`, '--size': size ? `${size}px` : undefined } as CSSProperties;
  return (
    <div className={styles.tile} style={style} role="img" aria-label={pet.name}>
      <span className={styles.face} aria-hidden>
        {pet.emoji}
      </span>
    </div>
  );
}
