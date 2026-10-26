import { useState } from 'react';
import { developerStampUrl } from '../../game/titleStamps';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { Tilt } from '../Tilt/Tilt';
import styles from './PetCard.module.css';

export interface PetCardProps {
  name: string;
  collected: boolean;
  /** 已收集为贴纸，未收集为剪影。 */
  imageSrc: string;
  /** 只对已收集宠物传入。 */
  owner?: { name: string; userId: string; avatarSrc: string } | null;
  /** 开发者彩蛋：毛肚、菠萝的卡片右上盖一枚小的「开发者家的认证」章，未收集也盖（game/easterEggs）。 */
  developer?: boolean;
  /** 传出被点的卡片元素，详情卡从它飞出、关闭时飞回。 */
  onOpen: (el: HTMLElement) => void;
}

/** 图鉴卡片：已收集展示贴纸与主人；未收集只展示名字与剪影，不泄露主人。 */
export function PetCard({ name, collected, imageSrc, owner, developer = false, onOpen }: PetCardProps) {
  const { t, locale } = useI18n();
  const [failed, setFailed] = useState(false);
  const stamp = developer ? developerStampUrl(locale) : null;
  return (
    <Tilt radius="var(--radius-lg)">
      <button type="button" className={styles.card} data-collected={collected} onClick={(e) => onOpen(e.currentTarget)} data-testid="pet-card">
        <span className={styles.art}>
          {!failed && <img src={imageSrc} alt="" loading="lazy" onError={() => setFailed(true)} />}
          {stamp && <img className={styles.stamp} src={stamp} alt={t('report.developer_certified')} draggable={false} data-testid="pet-card-developer" />}
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
          <span className={`${styles.chip} ${styles.muted}`}>{t(collected ? 'collection.filter_collected' : 'collection.filter_uncollected')}</span>
        )}
      </button>
    </Tilt>
  );
}
