import type { GameMode } from '../api/types';
import type { ReactNode } from 'react';
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
import { themeOf } from '../game/mode';
import styles from './Screen.module.css';

export interface PrepScreenProps {
  mode?: GameMode;
  /** 登记成功即展示本局阵容；登记中或登记失败为 null。 */
  pets: PetInfo[] | null;
  /** 阵容已返回，但开局所需的图片仍在加载。 */
  loading?: boolean;
  /** 本局入选的自家宠物名字。 */
  ownPetNames?: string[];
  failed?: boolean;
  verification?: ReactNode;
  verificationReady?: boolean;
  starting?: boolean;
  /** 人机验证正在后台进行（尚未拿到 token、也没有失败）：按钮写明在等什么。 */
  verifying?: boolean;
  onStart: () => void;
  onRetry?: () => void;
  onBack?: () => void;
}

/** 开局准备：棋盘的计时前状态，读说明不计时；对局登记成功后才允许点「开始这班」进入 90 秒。鱼关换深蓝水下主题。 */
export function PrepScreen({ mode = 'normal', pets, loading = false, ownPetNames = [], failed, verification, verificationReady = true, starting = false, verifying = false, onStart, onRetry, onBack }: PrepScreenProps) {
  const { t } = useI18n();
  const fish = mode === 'fish';
  return (
    <main className={styles.screen} data-theme={fish ? 'fish' : undefined}>
      {fish && <UnderwaterBackdrop />}
      <BrandHeader title="scheduling" schedulingArt onBack={onBack} />
      {pets && (
        <>
          <LineupPanel pets={pets} mode={themeOf(mode)} highResolution={!loading && !failed} />
          {!fish && <OwnPetBanner names={ownPetNames} />}
        </>
      )}
      {failed ? (
        <StatusMessage tone="error" text={t('prep.failed')} actionLabel={t('action.retry')} actionIcon="retry" onAction={onRetry} />
      ) : !pets ? (
        <StatusMessage text={t(fish ? 'fish.prep_loading' : 'prep.loading')} />
      ) : null}
      <RulesCard mode={mode} />
      <div className={styles.grow} />
      {verification}
      <Button size="lg" block icon={<ModeMark mode={mode} tone="onAccent" size={32} />} onClick={onStart} disabled={!pets || loading || failed || !verificationReady || starting} aria-busy={loading || starting || verifying} data-testid="start">
        {t(starting ? 'security.starting' : loading && !failed ? 'prep.preparing' : verifying && !failed ? 'security.verifying' : 'prep.start')}
      </Button>
    </main>
  );
}
