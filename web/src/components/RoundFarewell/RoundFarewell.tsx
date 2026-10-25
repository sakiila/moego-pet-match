import type { GameMode } from '../../api/types';
import { petDisplayName, type PetInfo } from '../../game/pets';
import type { Locale } from '../../i18n';
import { PetTile } from '../PetTile/PetTile';
import { Icon } from '../../ui/primitives/Icon';
import styles from './RoundFarewell.module.css';

export interface RoundFarewellProps {
  /** 调用方传入本局服务过的宠物；组件只展示最多三只可用的真实贴纸。 */
  pets: readonly PetInfo[];
  message: string;
  locale: Locale;
  mode?: GameMode;
}

export function RoundFarewell({ pets, message, locale, mode = 'normal' }: RoundFarewellProps) {
  const portraits = pets.filter((pet) => pet.id && pet.imageBase).slice(0, 3);
  if (portraits.length === 0) return null;

  return (
    <div className={styles.farewell} data-mode={mode} data-locale={locale} data-testid="round-farewell">
      <div className={styles.portraits}>
        {portraits.map((pet, index) => (
          <div key={pet.id} className={styles.portrait}>
            <PetTile pet={{ ...pet, name: petDisplayName(pet, locale), emoji: '' }} tint={index} size={128} variant="portrait" />
          </div>
        ))}
      </div>
      <p className={styles.message}>
        <Icon name="farewell-accent-left" size={16} />
        <span>{message}</span>
        <Icon name="farewell-accent-right" size={16} />
      </p>
    </div>
  );
}
