import { useState } from 'react';
import type { DeletionStatus as Status } from '../../api/types';
import { useI18n } from '../../i18n';
import { DeletionStatus } from '../DeletionStatus/DeletionStatus';
import { Icon } from '../../ui/primitives/Icon';
import styles from './MyPetCard.module.css';

export interface MyPetCardProps {
  name: string;
  stickerSrc: string;
  collected: boolean;
  /** 这只宠物的删除申请状态；有申请时以状态代替申请入口。 */
  request: Status | null;
  /** 传出这张卡片，详情卡从它飞出、关闭时飞回。 */
  onView: (el: HTMLElement) => void;
  onRequestRemoval: () => void;
}

/** 我的宠物卡：完整头像、收集状态、查看资料与低强调的删除申请；未收集时说明如何收进图鉴。 */
export function MyPetCard({ name, stickerSrc, collected, request, onView, onRequestRemoval }: MyPetCardProps) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  return (
    <article className={styles.card} data-collected={collected} data-testid="my-pet-card">
      <div className={styles.main}>
        <span className={styles.art}>{!failed && <img src={stickerSrc} alt="" onError={() => setFailed(true)} />}</span>
        <div className={styles.side}>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.state} data-collected={collected}>
            <Icon name={collected ? 'collected-badge' : 'uncollected-badge'} size={24} />
            {t(collected ? 'collection.filter_collected' : 'collection.filter_uncollected')}
          </span>
          <button type="button" className={styles.view} onClick={(e) => onView(e.currentTarget.closest('article') ?? e.currentTarget)} data-testid="my-pet-view">
            {t('my_pets.view')}
            <Icon name="forward-arrow" size={16} />
          </button>
          {request ? (
            <DeletionStatus status={request} />
          ) : (
            <button type="button" className={styles.remove} onClick={onRequestRemoval} data-testid="my-pet-remove">
              {t('info.removal_link')}
            </button>
          )}
        </div>
      </div>
      {!collected && <p className={styles.hint}>{t('my_pets.collection_hint')}</p>}
    </article>
  );
}
