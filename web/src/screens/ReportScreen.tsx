import type { DailyManager, GameMode, QuizResult } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { CollectionCards } from '../components/CollectionCards/CollectionCards';
import { FishInvitation } from '../components/FishInvitation/FishInvitation';
import { ManagerCard } from '../components/ManagerCard/ManagerCard';
import { NavTile } from '../components/NavTile/NavTile';
import { QuizCard } from '../components/QuizCard/QuizCard';
import { SaveStatus, type SaveState } from '../components/SaveStatus/SaveStatus';
import { UnderwaterBackdrop } from '../components/UnderwaterBackdrop/UnderwaterBackdrop';
import { ScoreCard } from '../components/ScoreCard/ScoreCard';
import type { GameSummary } from '../engine';
import { stickerUrl, type PetInfo } from '../game/pets';
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
  /** 打开对应模式的排行榜（鱼报告默认选中鱼榜）。 */
  onLeaderboard: () => void;
  onFishInvite: () => void;
  onAnswerQuiz: (quizId: string, choice: string | null) => Promise<QuizResult>;
  /** 今日店长：零服务承接鼓励，报告末尾留形象与签名；读取失败时省略。 */
  manager: DailyManager | null;
  onCollection: () => void;
  onOpenPet: (pet: PetInfo) => void;
  /** 打开成绩卡预览；不等揭晓动画，也不等保存结果。 */
  onShare: () => void;
}

/**
 * 完整 Report Card：分数立即显示，MVP 与称号随后出现，收获在保存成功后点亮；
 * 正文可滚动，底部固定「再开一局」。所有判定复用本局冻结结果。
 */
export function ReportScreen(props: ReportScreenProps) {
  const { mode, summary, pets, save, onRetry, onPlayAgain, onHome, onLeaderboard, onFishInvite, onAnswerQuiz, manager, onCollection, onOpenPet, onShare } = props;
  const { t } = useI18n();
  const mvpKind = judgeMvp(summary);
  const kindOf = (id: string) => pets.findIndex((p) => p.id === id);
  const saved = save.kind === 'saved' ? save.response : null;
  // 本局阵容里当前已下架的宠物：不再展示它们的资料（原 MVP 下架用通用图案承接）
  const removed = new Set(saved?.removedPetIds ?? []);
  const served = summary.clearedCells > 0;
  const fish = mode === 'fish';
  const subtitle = fish ? 'fish.report_subtitle' : served ? 'report.subtitle' : 'report.generic_caption';

  // 鱼报告：不涉及普通图鉴、竞猜、鱼关邀请与店长（服务端也不返回这些），导航为鱼关排行榜与回门店
  return (
    <main className={`${styles.screen} ${styles.withStickyActions}`} data-theme={fish ? 'fish' : undefined}>
      {fish && <UnderwaterBackdrop />}
      <BrandHeader heading={t(mode === 'fish' ? 'fish.report_title' : 'report.title')} tagline={subtitle} onBack={onHome} />
      <ScoreCard
        mode={mode}
        score={summary.score}
        saveState={save.kind === 'saved' ? 'saved' : save.kind === 'saving' ? 'saving' : 'failed'}
        newRecord={!!saved?.personalBest.isNew && saved.personalBest.previous !== null}
        mvp={mvpKind === null ? null : { pet: pets[mvpKind], kind: mvpKind }}
        mvpRemoved={mvpKind !== null && removed.has(pets[mvpKind].id)}
        review={judgeReview(summary, mode)}
        title={judgeTitle(summary)}
        stats={{ tiles: summary.clearedCells, chain: summary.maxChain, tools: summary.toolsFired }}
        host={mode === 'normal' && manager ? { name: manager.pet.name, stickerSrc: stickerUrl(manager.pet.petId, 512) } : null}
      />
      <SaveStatus state={save} onRetry={onRetry} />
      {!fish && save.kind === 'saved' && (
        <CollectionCards pets={save.newPets.map((p) => ({ pet: pets[kindOf(p.id)] ?? p, kind: kindOf(p.id) }))} onSelect={mode === 'normal' ? onOpenPet : undefined} />
      )}
      {!fish && saved?.quiz && kindOf(saved.quiz.petId) >= 0 && !removed.has(saved.quiz.petId) && (
        <QuizCard
          quiz={saved.quiz}
          pet={pets[kindOf(saved.quiz.petId)]}
          kind={kindOf(saved.quiz.petId)}
          onAnswer={(choice) => onAnswerQuiz(saved.quiz!.quizId, choice)}
        />
      )}
      {!fish && saved?.progress.unlockedNow && <FishInvitation onOpen={onFishInvite} />}
      {mode === 'normal' && manager && <ManagerCard variant="signature" name={manager.pet.name} stickerSrc={stickerUrl(manager.pet.petId, 512)} />}
      <nav className={styles.navRow}>
        {!fish && <NavTile icon="📖" label={t('nav.collection')} onClick={onCollection} />}
        <NavTile icon="🏆" label={t(fish ? 'fish.leaderboard' : 'nav.leaderboard')} onClick={onLeaderboard} />
        <NavTile icon="🏠" label={t('action.back_to_shop')} onClick={onHome} />
      </nav>
      <div className={`${styles.stickyActions} ${styles.actionPair}`}>
        <Button size="lg" block onClick={onPlayAgain} data-testid="play-again">
          {fish ? '🐟' : '🐾'} {t('action.play_again')}
        </Button>
        <Button size="lg" variant="secondary" block onClick={onShare} data-testid="share">
          {t('share.open')}
        </Button>
      </div>
    </main>
  );
}
