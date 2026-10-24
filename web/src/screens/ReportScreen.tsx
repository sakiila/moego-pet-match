import { useEffect, useState } from 'react';
import type { AchievementId, AchievementStatus, DailyManager, GameMode, QuizResult } from '../api/types';
import { AchievementUnlocks } from '../components/AchievementUnlocks/AchievementUnlocks';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { CollectionCards } from '../components/CollectionCards/CollectionCards';
import { FishInvitation } from '../components/FishInvitation/FishInvitation';
import { ManagerCard } from '../components/ManagerCard/ManagerCard';
import { ModeMark } from '../components/ModeMark/ModeMark';
import { NavTile } from '../components/NavTile/NavTile';
import { NextUp } from '../components/NextUp/NextUp';
import { QuizCard } from '../components/QuizCard/QuizCard';
import { SaveStatus, type SaveState } from '../components/SaveStatus/SaveStatus';
import { UnderwaterBackdrop } from '../components/UnderwaterBackdrop/UnderwaterBackdrop';
import { ScoreCard } from '../components/ScoreCard/ScoreCard';
import type { GameSummary } from '../engine';
import { pickNextUp } from '../game/nextUp';
import { petImage, stickerUrl, type PetInfo } from '../game/pets';
import { judgeMvp, judgeReview, judgeTitle } from '../game/report';
import type { Standing } from '../game/standing';
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
  onOpenPet: (pet: PetInfo, el: HTMLElement) => void;
  /** 打开成绩卡预览；不等揭晓动画，也不等保存结果。 */
  onShare: () => void;
  /** 读取今日榜上的名次：保存成功后调用一次，猜主人加分后再调一次；失败或不提供时不显示。 */
  loadStanding?: () => Promise<Standing | null>;
  /** 读取成就进度，用于「下一件事」：保存成功后调用一次；失败时仍按鱼关与兜底预告。 */
  loadAchievements?: () => Promise<AchievementStatus[]>;
  equippedTitle?: AchievementId | null;
  onEquipTitle?: (id: AchievementId) => Promise<void>;
  onTitles?: () => void;
}

/**
 * 完整 Report Card：分数立即显示，MVP 与称号随后出现，收获在保存成功后点亮；
 * 正文可滚动，底部固定「再开一局」。所有判定复用本局冻结结果。
 */
export function ReportScreen(props: ReportScreenProps) {
  const { mode, summary, pets, save, onRetry, onPlayAgain, onHome, onLeaderboard, onFishInvite, onAnswerQuiz, manager, onCollection, onOpenPet, onShare, loadStanding, loadAchievements } = props;
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
  // 下一件事：保存成功后读一次成就进度；本局弹出鱼关邀请时不再叠加预告
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
  const nextUp = saved && achievements !== undefined && !saved.progress.unlockedNow ? pickNextUp({ progress: saved.progress, achievements }) : null;
  const speaker =
    mvpKind !== null && !removed.has(pets[mvpKind].id) && petImage(pets[mvpKind], 512)
      ? { name: pets[mvpKind].name, src: petImage(pets[mvpKind], 512)! }
      : manager
        ? { name: manager.pet.name, src: stickerUrl(manager.pet.petId, 512) }
        : null;
  const served = summary.clearedCells > 0;
  const fish = mode === 'fish';
  const subtitle = fish ? 'fish.report_subtitle' : served ? 'report.subtitle' : 'report.generic_caption';

  // 鱼报告：不涉及普通图鉴、竞猜、鱼关邀请与店长（服务端也不返回这些），导航为鱼关排行榜与回门店
  return (
    <main className={`${styles.screen} ${styles.withStickyActions} ${styles.afterPrint}`} data-theme={fish ? 'fish' : undefined}>
      {fish && <UnderwaterBackdrop />}
      <BrandHeader heading={t(mode === 'fish' ? 'fish.report_title' : 'report.title')} headingAccent tagline={subtitle} onBack={onHome} />
      <ScoreCard
        mode={mode}
        score={quizResult?.score ?? saved?.score ?? summary.score}
        quizBonus={quizResult?.bonus}
        saveState={save.kind === 'saved' ? 'saved' : save.kind === 'saving' ? 'saving' : 'failed'}
        newRecord={!!best?.isNew && best.previous !== null}
        mvp={mvpKind === null ? null : { pet: pets[mvpKind], kind: mvpKind }}
        mvpRemoved={mvpKind !== null && removed.has(pets[mvpKind].id)}
        review={judgeReview(summary, mode)}
        title={judgeTitle(summary)}
        stats={{ tiles: summary.clearedCells, chain: summary.maxChain, tools: summary.toolsFired }}
        host={mode === 'normal' && manager ? { name: manager.pet.name, stickerSrc: stickerUrl(manager.pet.petId, 512) } : null}
        standing={standing}
        streak={saved?.streak ?? null}
      />
      <SaveStatus state={save} onRetry={onRetry} />
      {saved && <AchievementUnlocks ids={saved.newAchievements ?? []} equippedTitle={props.equippedTitle} onEquip={props.onEquipTitle} onOpenTitles={props.onTitles} />}
      {!fish && save.kind === 'saved' && (
        <CollectionCards pets={save.newPets.map((p) => ({ pet: pets[kindOf(p.id)] ?? p, kind: kindOf(p.id) }))} onSelect={mode === 'normal' ? onOpenPet : undefined} />
      )}
      {!fish && saved?.quiz && kindOf(saved.quiz.petId) >= 0 && !removed.has(saved.quiz.petId) && (
        <QuizCard
          quiz={saved.quiz}
          pet={pets[kindOf(saved.quiz.petId)]}
          kind={kindOf(saved.quiz.petId)}
          onAnswer={async (choice) => {
            const result = await onAnswerQuiz(saved.quiz!.quizId, choice);
            setQuizResult(result);
            return result;
          }}
        />
      )}
      {!fish && saved?.progress.unlockedNow && <FishInvitation onOpen={onFishInvite} />}
      {!fish && nextUp && <NextUp nextUp={nextUp} speaker={speaker} onOpenCollection={onCollection} />}
      {mode === 'normal' && manager && <ManagerCard variant="signature" name={manager.pet.name} stickerSrc={stickerUrl(manager.pet.petId, 512)} />}
      <nav className={styles.navRow}>
        {!fish && <NavTile icon="pet-collection" label={t('nav.collection')} onClick={onCollection} />}
        <NavTile icon="leaderboard" label={t(fish ? 'fish.leaderboard' : 'nav.leaderboard')} onClick={onLeaderboard} />
        <NavTile icon="back-to-shop" label={t('action.back_to_shop')} onClick={onHome} />
      </nav>
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
