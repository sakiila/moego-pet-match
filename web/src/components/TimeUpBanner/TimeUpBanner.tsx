import type { GameMode } from '../../api/types';
import type { PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import { ClosingSign } from '../ClosingSign/ClosingSign';
import { RoundFarewell } from '../RoundFarewell/RoundFarewell';
import styles from './TimeUpBanner.module.css';

const NO_PETS: readonly PetInfo[] = [];

export interface TimeUpBannerProps {
  /** 只传本局实际服务过的告别宠物，详见 selectFarewellPets。 */
  pets?: readonly PetInfo[];
  mode?: GameMode;
}

/** 最后一波结算结束后才挂载：落牌后轻弹致谢，再由页面进入报告。 */
export function TimeUpBanner({ pets = NO_PETS, mode = 'normal' }: TimeUpBannerProps) {
  const { t, locale } = useI18n();
  return (
    <div className={styles.scrim} role="status" aria-live="polite" data-testid="time-up" data-mode={mode}>
      <div className={styles.content}>
        <ClosingSign locale={locale} label={t('round.finished')} />
        <RoundFarewell pets={pets} mode={mode} locale={locale} message={t('round.thanks')} />
      </div>
    </div>
  );
}
