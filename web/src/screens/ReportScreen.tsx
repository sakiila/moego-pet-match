import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { ReportSummary } from '../components/ReportSummary/ReportSummary';
import type { GameSummary } from '../engine';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import styles from './Screen.module.css';

/** 阶段 1 基础报告：分数与服务统计；MVP、称号与保存状态在后续阶段接入。 */
export function ReportScreen({ summary, onPlayAgain }: { summary: GameSummary; onPlayAgain: () => void }) {
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
      <div className={styles.grow} />
      <Button size="lg" block onClick={onPlayAgain} data-testid="play-again">
        {t('action.play_again')}
      </Button>
    </main>
  );
}
