import type { PlayerPet } from '../../api/types';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import styles from './PlayerPets.module.css';

export interface PlayerPetsProps {
  pets: readonly (PlayerPet & { stickerSrc: string; silhouetteSrc: string })[] | null;
  own?: boolean;
  error?: boolean;
  onRetry: () => void;
  onOpen: (petId: string, name: string, origin: HTMLElement) => void;
}

/** 被查看玩家的上架宠物，收集标记始终属于查看者；主人可查看自家完整形象。 */
export function PlayerPets({ pets, own = false, error = false, onRetry, onOpen }: PlayerPetsProps) {
  const { t } = useI18n();
  return <section className={styles.root} data-testid="player-pets">
    <div className={styles.heading}>
      <h3>{t(own ? 'profile.pets_own' : 'profile.pets')}</h3>
      {pets && !error && <span>{t(pets.length === 1 ? 'profile.pets_count_one' : 'profile.pets_count', { count: pets.length })}</span>}
    </div>
    {error ? <StatusMessage tone="error" text={t('profile.pets_failed')} actionLabel={t('action.retry')} onAction={onRetry} />
      : !pets ? <p className={styles.hint} role="status">{t('profile.pets_loading')}</p>
      : !pets.length ? <p className={styles.hint}>{t('profile.pets_empty')}</p> : <>
        <p className={styles.progress}>{t('profile.pets_progress', { collected: pets.filter(pet => pet.collected).length, total: pets.length })}</p>
        <div className={styles.grid}>
          {pets.map(pet => <button key={pet.petId} type="button" className={styles.card}
            data-collected={pet.collected} data-own={own} data-testid="player-pet-card"
            aria-label={t('profile.pet_open', { petName: pet.name })}
            onClick={event => onOpen(pet.petId, pet.name, event.currentTarget)}>
            <span className={styles.art}><img src={pet.collected || own ? pet.stickerSrc : pet.silhouetteSrc} alt="" loading="lazy" decoding="async" /></span>
            <span className={styles.name}>{pet.name}</span>
            <span className={styles.state} data-collected={pet.collected}>
              <Icon name={pet.collected ? 'collected-badge' : 'uncollected-badge'} size={20} />
              {t(pet.collected ? 'collection.filter_collected' : 'collection.filter_uncollected')}
            </span>
          </button>)}
        </div>
        <p className={`${styles.hint} ${styles.tap}`}>{t('profile.pets_hint')}</p>
      </>}
  </section>;
}
