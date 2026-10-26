import { useEffect, useState, type CSSProperties } from 'react';
import { loadPetImage, petImage, type PetInfo } from '../../game/pets';
import styles from './PetTile.module.css';

export interface PetTileProps {
  pet: PetInfo;
  /** 本局 kind 下标，决定辅助底色。 */
  tint: number;
  size?: number;
  /** 阵容头像直接放在浅色卡片上，不再套一层棋格。 */
  variant?: 'tile' | 'portrait';
  /** 必需的小图就绪后才发起高清升级；高清失败时保留小图。 */
  highResolution?: boolean;
}

/** 宠物头像 + 本局固定浅底色；棋格内不放名字。贴纸加载失败时回退占位。 */
export function PetTile({ pet, tint, size, variant = 'tile', highResolution = true }: PetTileProps) {
  const [largeReady, setLargeReady] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const style = { '--tint': `var(--pet-tint-${tint % 6})`, '--size': size ? `${size}px` : undefined } as CSSProperties;
  const preview = petImage(pet, 128);
  const large = size && size * 2 > 128 ? petImage(pet, 512) : null;
  const src = large && largeReady === large && !failed.includes(large) ? large : preview;

  useEffect(() => {
    if (!highResolution || !large) return;
    let active = true;
    void loadPetImage(large).then(() => {
      if (active) setLargeReady(large);
    }, () => {
      // 高清只是增强，继续显示已就绪的小图，不把失败传给开局准备。
    });
    return () => { active = false; };
  }, [large, highResolution]);

  return (
    <div className={styles.tile} data-variant={variant} style={style} role="img" aria-label={pet.name}>
      {src && !failed.includes(src) ? (
        <img className={styles.sticker} src={src} alt="" draggable={false} onError={() => setFailed(previous => [...previous, src])} />
      ) : (
        <span className={styles.face} aria-hidden>
          {pet.emoji}
        </span>
      )}
    </div>
  );
}
