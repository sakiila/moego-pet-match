import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { ReportSummary } from '../components/ReportSummary/ReportSummary';
import { SaveStatus, type SaveState } from '../components/SaveStatus/SaveStatus';
import type { GameSummary } from '../engine';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import styles from './Screen.module.css';

export interface ReportScreenProps {
  summary: GameSummary;
  save: SaveState;
  onRetry: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

/** 基础报告：先展示本局表现，再按保存状态点亮收获；再开与回门店始终可用。 */
export function ReportScreen({ summary, save, onRetry, onPlayAgain, onHome }: ReportScreenProps) {
  const { t } = useI18n();
  return (
    <main className={styles.screen}>
      <BrandHeader />
      <ReportSummary
        score={summary.score}
        clearedCells={summary.clearedCells}
        maxChain={summary.maxChain}
        toolsFired={summary.toolsFired}
      />
      <SaveStatus state={save} onRetry={onRetry} />
      <div className={styles.grow} />
      <Button size="lg" block onClick={onPlayAgain} data-testid="play-again">
        {t('action.play_again')}
      </Button>
      <Button variant="secondary" block onClick={onHome} data-testid="back-home">
        {t('action.back_to_shop')}
      </Button>
    </main>
  );
}
