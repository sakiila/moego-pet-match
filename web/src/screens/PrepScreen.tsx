import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { LineupPanel } from '../components/LineupPanel/LineupPanel';
import { RulesCard } from '../components/RulesCard/RulesCard';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import type { PetInfo } from '../game/pets';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import styles from './Screen.module.css';

export interface PrepScreenProps {
  /** 登记成功后的本局阵容；登记中或失败为 null。 */
  pets: PetInfo[] | null;
  failed?: boolean;
  onStart: () => void;
  onRetry?: () => void;
}

/** 开局准备：棋盘的计时前状态，读说明不计时；对局登记成功后才允许点「开始这班」进入 90 秒。 */
export function PrepScreen({ pets, failed, onStart, onRetry }: PrepScreenProps) {
  const { t } = useI18n();
  return (
    <main className={styles.screen}>
      <BrandHeader />
      {pets ? (
        <LineupPanel pets={pets} />
      ) : failed ? (
        <StatusMessage tone="error" text={t('prep.failed')} actionLabel={t('action.retry')} onAction={onRetry} />
      ) : (
        <StatusMessage text={t('prep.loading')} />
      )}
      <RulesCard />
      <div className={styles.grow} />
      <Button size="lg" block onClick={onStart} disabled={!pets} data-testid="start">
        🐾 {t('prep.start')}
      </Button>
    </main>
  );
}
