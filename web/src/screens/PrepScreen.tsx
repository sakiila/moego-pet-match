import type { GameMode } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { ModeMark } from '../components/ModeMark/ModeMark';
import { LineupPanel } from '../components/LineupPanel/LineupPanel';
import { OwnPetBanner } from '../components/OwnPetBanner/OwnPetBanner';
import { RulesCard } from '../components/RulesCard/RulesCard';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { UnderwaterBackdrop } from '../components/UnderwaterBackdrop/UnderwaterBackdrop';
import type { PetInfo } from '../game/pets';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import styles from './Screen.module.css';

export interface PrepScreenProps {
  mode?: GameMode;
  /** 登记成功后的本局阵容；登记中或失败为 null。 */
  pets: PetInfo[] | null;
  /** 本局入选的自家宠物名字。 */
  ownPetNames?: string[];
  failed?: boolean;
  onStart: () => void;
  onRetry?: () => void;
  onBack?: () => void;
}

/** 开局准备：棋盘的计时前状态，读说明不计时；对局登记成功后才允许点「开始这班」进入 90 秒。鱼关换深蓝水下主题。 */
export function PrepScreen({ mode = 'normal', pets, ownPetNames = [], failed, onStart, onRetry, onBack }: PrepScreenProps) {
  const { t } = useI18n();
  const fish = mode === 'fish';
  return (
    <main className={styles.screen} data-theme={fish ? 'fish' : undefined}>
      {fish && <UnderwaterBackdrop />}
      <BrandHeader title={fish ? 'fish' : 'scheduling'} schedulingArt={!fish} onBack={onBack} />
      {pets ? (
        <>
          <LineupPanel pets={pets} mode={mode} />
          {!fish && <OwnPetBanner names={ownPetNames} />}
        </>
      ) : failed ? (
        <StatusMessage tone="error" text={t('prep.failed')} actionLabel={t('action.retry')} actionIcon="retry" onAction={onRetry} />
      ) : (
        <StatusMessage text={t(fish ? 'fish.prep_loading' : 'prep.loading')} />
      )}
      <RulesCard mode={mode} />
      <div className={styles.grow} />
      <Button size="lg" block icon={<ModeMark mode={mode} tone="onAccent" size={32} />} onClick={onStart} disabled={!pets} data-testid="start">
        {t('prep.start')}
      </Button>
    </main>
  );
}
