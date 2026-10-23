import type { CSSProperties } from 'react';
import { petImage, type PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import styles from './CollectionCards.module.css';

/** 本局新收集：只在服务端保存成功后点亮；按独立宠物逐只展开，不把服务格数说成宠物数。点击打开同一套图鉴详情。 */
export function CollectionCards({ pets, onSelect }: { pets: { pet: PetInfo; kind: number }[]; onSelect?: (pet: PetInfo) => void }) {
  const { t } = useI18n();
  if (pets.length === 0) return null;
  return (
    <section className={styles.box} data-testid="new-collection">
      <h3 className={styles.title}>
        {t('report.new_collection')}
        <span className={styles.count}>{pets.length}</span>
      </h3>
      <div className={styles.grid}>
        {pets.map(({ pet, kind }, i) => (
          <button
            type="button"
            key={pet.id}
            className={styles.card}
            disabled={!onSelect}
            onClick={() => onSelect?.(pet)}
            style={{ '--tint': `var(--pet-tint-${kind % 6})`, animationDelay: `${i * 80}ms` } as CSSProperties}
          >
            {petImage(pet, 512) ? <img src={petImage(pet, 512)!} alt="" /> : <span className={styles.emoji}>{pet.emoji}</span>}
            <span className={styles.name}>{pet.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
