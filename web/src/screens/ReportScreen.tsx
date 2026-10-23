import type { GameMode, QuizResult } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { CollectionCards } from '../components/CollectionCards/CollectionCards';
import { FishInvitation } from '../components/FishInvitation/FishInvitation';
import { NavTile } from '../components/NavTile/NavTile';
import { QuizCard } from '../components/QuizCard/QuizCard';
import { SaveStatus, type SaveState } from '../components/SaveStatus/SaveStatus';
import { ScoreCard } from '../components/ScoreCard/ScoreCard';
import type { GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { judgeMvp, judgeReview, judgeTitle } from '../game/report';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import styles from './Screen.module.css';

export interface ReportScreenProps {
  mode: GameMode;
  summary: GameSummary;
  /** 本局阵容（按引擎 kind 顺序）。 */
  pets: PetInfo[];
  save: SaveState;
  onRetry: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
  onFishInvite: () => void;
  onAnswerQuiz: (quizId: string, choice: string | null) => Promise<QuizResult>;
}

/**
 * 完整 Report Card：分数立即显示，MVP 与称号随后出现，收获在保存成功后点亮；
 * 正文可滚动，底部固定「再开一局」。所有判定复用本局冻结结果。
 */
export function ReportScreen({ mode, summary, pets, save, onRetry, onPlayAgain, onHome, onLeaderboard, onFishInvite, onAnswerQuiz }: ReportScreenProps) {
  const { t } = useI18n();
  const mvpKind = judgeMvp(summary);
  const kindOf = (id: string) => pets.findIndex((p) => p.id === id);
  const saved = save.kind === 'saved' ? save.response : null;
  const served = summary.clearedCells > 0;
  const subtitle = mode === 'fish' ? 'fish.report_subtitle' : served ? 'report.subtitle' : 'report.generic_caption';

  return (
    <main className={`${styles.screen} ${styles.withStickyActions}`}>
      <BrandHeader heading={t(mode === 'fish' ? 'fish.report_title' : 'report.title')} tagline={subtitle} onBack={onHome} />
      <ScoreCard
        mode={mode}
        score={summary.score}
        saveState={save.kind === 'saved' ? 'saved' : save.kind === 'saving' ? 'saving' : 'failed'}
        newRecord={!!saved?.personalBest.isNew && saved.personalBest.previous !== null}
        mvp={mvpKind === null ? null : { pet: pets[mvpKind], kind: mvpKind }}
        review={judgeReview(summary, mode)}
        title={judgeTitle(summary)}
        stats={{ tiles: summary.clearedCells, chain: summary.maxChain, tools: summary.toolsFired }}
      />
      <SaveStatus state={save} onRetry={onRetry} />
      {save.kind === 'saved' && (
        <CollectionCards pets={save.newPets.map((p) => ({ pet: pets[kindOf(p.id)] ?? p, kind: kindOf(p.id) }))} />
      )}
      {saved?.quiz && kindOf(saved.quiz.petId) >= 0 && (
        <QuizCard
          quiz={saved.quiz}
          pet={pets[kindOf(saved.quiz.petId)]}
          kind={kindOf(saved.quiz.petId)}
          onAnswer={(choice) => onAnswerQuiz(saved.quiz!.quizId, choice)}
        />
      )}
      {saved?.progress.unlockedNow && <FishInvitation onOpen={onFishInvite} />}
      <nav className={styles.navRow}>
        <NavTile icon="🏆" label={t('nav.leaderboard')} onClick={onLeaderboard} />
        <NavTile icon="🏠" label={t('action.back_to_shop')} onClick={onHome} />
      </nav>
      <div className={styles.stickyActions}>
        <Button size="lg" block onClick={onPlayAgain} data-testid="play-again">
          🐾 {t('action.play_again')}
        </Button>
      </div>
    </main>
  );
}
