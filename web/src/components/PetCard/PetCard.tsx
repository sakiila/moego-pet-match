import { useState } from 'react';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import styles from './PetCard.module.css';

export interface PetCardProps {
  name: string;
  collected: boolean;
  /** 已收集为贴纸，未收集为剪影。 */
  imageSrc: string;
  /** 只对已收集宠物传入。 */
  owner?: { name: string; userId: string; avatarSrc: string } | null;
  onOpen: () => void;
}

/** 图鉴卡片：已收集展示贴纸与主人；未收集只展示名字与剪影，不泄露主人。 */
export function PetCard({ name, collected, imageSrc, owner, onOpen }: PetCardProps) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  return (
    <button type="button" className={styles.card} data-collected={collected} onClick={onOpen} data-testid="pet-card">
      <span className={styles.art}>
        {!failed && <img src={imageSrc} alt="" loading="lazy" onError={() => setFailed(true)} />}
      </span>
      <span className={styles.name}>{name}</span>
      {collected && owner ? (
        <span className={styles.chip}>
          <Avatar name={owner.name} seed={owner.userId} src={owner.avatarSrc} size={22} />
          <span className={styles.chipText}>
            {t('pet.owner')} {owner.name}
          </span>
        </span>
      ) : (
        <span className={`${styles.chip} ${styles.muted}`}>{t('collection.filter_uncollected')}</span>
      )}
    </button>
  );
}
