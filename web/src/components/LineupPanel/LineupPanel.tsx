import { useId, type CSSProperties } from 'react';
import type { GameMode } from '../../api/types';
import { petDisplayName, type PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import { PetTile } from '../PetTile/PetTile';
import { ModeMark } from '../ModeMark/ModeMark';
import styles from './LineupPanel.module.css';

/** 本局来客：头像、本局底色与名字一一对应，帮助在棋盘上认出各种棋子。鱼关显示 6 个鱼色类别名。 */
export function LineupPanel({ pets, mode = 'normal', highResolution = true }: { pets: PetInfo[]; mode?: GameMode; highResolution?: boolean }) {
  const { t, locale } = useI18n();
  const headingId = useId();
  const illustrated = mode === 'normal';
  return (
    <section className={styles.panel} data-mode={mode} data-locale={locale} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        <ModeMark mode={mode} size={illustrated ? 32 : 26} />
        {illustrated ? (
          <span>{t('prep.guests_lead')}{locale === 'en' ? ' ' : ''}<em>{t('prep.guests_accent')}</em></span>
        ) : t('prep.guests')}
      </h2>
      <div className={styles.grid}>
        {pets.map((pet, kind) => (
          <div key={pet.id} className={styles.card} style={{ '--tint': `var(--pet-tint-${kind})` } as CSSProperties}>
            <div className={styles.avatar}>
              <PetTile pet={pet} tint={kind} size={illustrated ? 120 : 64} variant={illustrated ? 'portrait' : 'tile'} highResolution={highResolution} />
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
