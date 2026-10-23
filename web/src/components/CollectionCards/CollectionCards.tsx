import type { CSSProperties } from 'react';
import { petImage, type PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import styles from './CollectionCards.module.css';

/** 本局新收集：只在服务端保存成功后点亮；按独立宠物逐只展开，不把服务格数说成宠物数。 */
export function CollectionCards({ pets }: { pets: { pet: PetInfo; kind: number }[] }) {
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
          <div key={pet.id} className={styles.card} style={{ '--tint': `var(--pet-tint-${kind % 6})`, animationDelay: `${i * 80}ms` } as CSSProperties}>
            {petImage(pet, 512) ? <img src={petImage(pet, 512)!} alt="" /> : <span className={styles.emoji}>{pet.emoji}</span>}
            <span className={styles.name}>{pet.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
