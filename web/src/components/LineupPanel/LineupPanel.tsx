import type { CSSProperties } from 'react';
import type { GameMode } from '../../api/types';
import { petDisplayName, type PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import { PetTile } from '../PetTile/PetTile';
import styles from './LineupPanel.module.css';

/** 本局来客：头像、本局底色与名字一一对应，帮助在棋盘上认出各种棋子。鱼关显示 6 个鱼色类别名。 */
export function LineupPanel({ pets, mode = 'normal' }: { pets: PetInfo[]; mode?: GameMode }) {
  const { t, locale } = useI18n();
  return (
    <section className={styles.panel} aria-labelledby="lineup-heading">
      <h2 id="lineup-heading" className={styles.heading}>
        {mode === 'fish' ? '🐟' : '🐾'} {t('prep.guests')}
      </h2>
      <div className={styles.grid}>
        {pets.map((pet, kind) => (
          <div key={pet.id} className={styles.card} style={{ '--tint': `var(--pet-tint-${kind})` } as CSSProperties}>
            <div className={styles.avatar}>
              <PetTile pet={pet} tint={kind} size={64} />
            </div>
            <span className={styles.name} title={petDisplayName(pet, locale)}>
              {petDisplayName(pet, locale)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
