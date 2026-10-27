import { useEffect, useState } from 'react';
import type { AchievementId, AchievementStatus, DailyManager, GameMode, QuizResult } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { FishInvitation } from '../components/FishInvitation/FishInvitation';
import { ModeMark } from '../components/ModeMark/ModeMark';
import { NextUp } from '../components/NextUp/NextUp';
import { QuizCard } from '../components/QuizCard/QuizCard';
import { ReportHarvest } from '../components/ReportHarvest/ReportHarvest';
import { SaveStatus, type SaveState } from '../components/SaveStatus/SaveStatus';
import { UnderwaterBackdrop } from '../components/UnderwaterBackdrop/UnderwaterBackdrop';
import { ScoreCard } from '../components/ScoreCard/ScoreCard';
import type { GameSummary } from '../engine';
import { pickNextUp } from '../game/nextUp';
import { stickerUrl, type PetInfo } from '../game/pets';
import { isDeveloperPet } from '../game/easterEggs';
import { judgeMvp, judgeTitle, pickReview } from '../game/report';
import type { Standing } from '../game/standing';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { themeOf } from '../game/mode';
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
  /** 保留给外层路由；精简版报告内不再放排行榜入口。 */
  onLeaderboard?: () => void;
  onFishInvite: () => void;
  onAnswerQuiz: (quizId: string, choice: string | null) => Promise<QuizResult>;
  /** 今日店长：零服务时承接鼓励评语，并作为尾声「店长说」的说话人；读取失败时省略。 */
  manager: DailyManager | null;
  /** 保留给外层路由；精简版报告内不再放图鉴入口。 */
  onCollection?: () => void;
  onOpenPet: (pet: PetInfo, el: HTMLElement) => void;
  /** 打开成绩卡预览；不等揭晓动画，也不等保存结果。 */
  onShare: () => void;
  /** 读取今日榜上的名次：保存成功后调用一次，猜主人加分后再调一次；失败或不提供时不显示。 */
  loadStanding?: () => Promise<Standing | null>;
  /** 读取成就进度，用于尾声「店长说」预告：保存成功后调用一次；失败时仍有玩法提示、鱼关与兜底。 */
  loadAchievements?: () => Promise<AchievementStatus[]>;
  equippedTitle?: AchievementId | null;
  onEquipTitle?: (id: AchievementId) => Promise<void>;
  onTitles?: () => void;
}

/**
 * 完整 Report Card（mobile-report-slim-v1，五块）：小票（分数、状态标签行、MVP、称号章、统计）→
 * 本局收获（新收集 + 新称号）→ 猜主人 → 尾声（鱼关邀请或「店长说」预告，二选一）→ 再开 / 分享。
 * 分数立即显示，MVP 与称号随后出现，收获在保存成功后点亮；所有判定复用本局冻结结果。
 * 报告内不放跳转按钮：回门店在头部，排行榜与图鉴都从门店进入。
 */
export function ReportScreen(props: ReportScreenProps) {
  const { mode, summary, pets, save, onRetry, onPlayAgain, onHome, onFishInvite, onAnswerQuiz, manager, onOpenPet, onShare, loadStanding, loadAchievements } = props;
  const { t } = useI18n();
  const mvpKind = judgeMvp(summary);
  const kindOf = (id: string) => pets.findIndex((p) => p.id === id);
  const saved = save.kind === 'saved' ? save.response : null;
  // 猜主人作答后以服务端返回的总分与最好成绩为准（答对已含奖励）
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const best = quizResult?.personalBest ?? saved?.personalBest;
  // 今日名次：结果保存成功后读取；答对竞猜后总分变了，再读一次
  const [standing, setStanding] = useState<Standing | null>(null);
  const savedScore = quizResult?.score ?? saved?.score ?? null;
  useEffect(() => {
    if (savedScore === null || !loadStanding) return;
    let live = true;
    loadStanding()
      .then((s) => live && setStanding(s))
      .catch(() => live && setStanding(null));
    return () => {
      live = false;
    };
  }, [savedScore, loadStanding]);
  // 本局阵容里当前已下架的宠物：不再展示它们的资料（原 MVP 下架用通用图案承接）
  const removed = new Set(saved?.removedPetIds ?? []);
  // 店长说预告：保存成功后读一次成就进度；本局弹出鱼关邀请时不再叠加预告
  const [achievements, setAchievements] = useState<AchievementStatus[] | null | undefined>(undefined);
  const savedGameId = saved?.gameId ?? null;
  useEffect(() => {
    if (!savedGameId) return;
    let live = true;
    (loadAchievements?.() ?? Promise.resolve(null))
      .then((a) => live && setAchievements(a))
      .catch(() => live && setAchievements(null));
    return () => {
      live = false;
    };
  }, [savedGameId, loadAchievements]);
  const nextUp = saved && achievements !== undefined && !saved.progress.unlockedNow ? pickNextUp({ gameId: saved.gameId, progress: saved.progress, achievements }) : null;
  // 「店长说」：预告固定由今日店长开口；店长读取失败时气泡不带头像
  const speaker = manager ? { name: manager.pet.name, src: stickerUrl(manager.pet.petId, 512) } : null;
  const served = summary.clearedCells > 0;
  const fish = mode === 'fish';
  const subtitle = fish ? 'fish.report_subtitle' : served ? 'report.subtitle' : 'report.generic_caption';

  // 鱼报告：不涉及普通图鉴、竞猜、鱼关邀请与预告（服务端也不返回这些）
  return (
    <main className={`${styles.screen} ${styles.withStickyActions} ${styles.afterPrint}`} data-theme={fish ? 'fish' : undefined}>
      {fish && <UnderwaterBackdrop />}
      <BrandHeader title={fish ? 'fish-report' : 'report'} tagline={subtitle} onBack={onHome} />
      <ScoreCard
        mode={themeOf(mode)}
        score={quizResult?.score ?? saved?.score ?? summary.score}
        quizBonus={quizResult?.bonus}
        saveState={save.kind === 'saved' ? 'saved' : save.kind === 'saving' ? 'saving' : 'failed'}
        newRecord={!!best?.isNew && best.previous !== null}
        mvp={mvpKind === null ? null : { pet: pets[mvpKind], kind: mvpKind }}
        mvpRemoved={mvpKind !== null && removed.has(pets[mvpKind].id)}
        review={pickReview(summary, mode)}
        title={judgeTitle(summary)}
        stats={{ tiles: summary.clearedCells, chain: summary.maxChain, tools: summary.toolsFired }}
        host={mode === 'normal' && manager ? { name: manager.pet.name, stickerSrc: stickerUrl(manager.pet.petId, 512) } : null}
        standing={standing}
        streak={saved?.streak ?? null}
        faction={saved?.faction ?? null}
        certified={mode === 'normal' && mvpKind !== null && !removed.has(pets[mvpKind].id) && isDeveloperPet(pets[mvpKind].id)}
      />
      <SaveStatus state={save} onRetry={onRetry} />
      {save.kind === 'saved' && (
        <ReportHarvest
          pets={fish ? [] : save.newPets.map((p) => ({ pet: pets[kindOf(p.id)] ?? p, kind: kindOf(p.id) }))}
          achievements={save.response.newAchievements ?? []}
          onSelectPet={mode === 'normal' ? onOpenPet : undefined}
          onOpenTitles={props.onTitles}
        />
      )}
      {!fish && saved?.quiz && kindOf(saved.quiz.petId) >= 0 && !removed.has(saved.quiz.petId) && (
        <QuizCard
          quiz={saved.quiz}
          pet={pets[kindOf(saved.quiz.petId)]}
          kind={kindOf(saved.quiz.petId)}
          developer={isDeveloperPet(saved.quiz.petId)}
          onAnswer={async (choice) => {
            const result = await onAnswerQuiz(saved.quiz!.quizId, choice);
            setQuizResult(result);
            return result;
          }}
        />
      )}
      {/* 尾声只放一条：解锁那一局是鱼关邀请，其余是「店长说」预告；AI 局不计收集与称号，没有预告 */}
      {!fish && saved?.progress.unlockedNow && <FishInvitation onOpen={onFishInvite} />}
      {mode === 'normal' && nextUp && <NextUp nextUp={nextUp} speaker={speaker} />}
      <div className={`${styles.stickyActions} ${styles.actionPair}`}>
        <Button size="lg" block icon={<ModeMark mode={mode} tone="onAccent" size={32} />} onClick={onPlayAgain} data-testid="play-again">
          {t('action.play_again')}
        </Button>
        <Button size="lg" variant="secondary" block iconName="share-image" onClick={onShare} data-testid="share">
          {t('share.open')}
        </Button>
      </div>
    </main>
  );
}
