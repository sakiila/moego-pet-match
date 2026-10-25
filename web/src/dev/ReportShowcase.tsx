import { useMemo } from 'react';
import type { DailyManager, QuizResult, RegisteredGame } from '../api/types';
import type { GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import type { Standing } from '../game/standing';
import { ReportScreen } from '../screens/ReportScreen';

export interface ReportShowcaseProps {
  summary: GameSummary;
  registered: RegisteredGame;
  pets: PetInfo[];
  manager: DailyManager | null;
  /** 尾声显示鱼关邀请（否则显示「下一件事」）。 */
  invite: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
  onFishInvite: () => void;
  onOpenPet: (pet: PetInfo, el: HTMLElement) => void;
  onShare: () => void;
  onTitles?: () => void;
}

/**
 * 开发验收：?report=showcase。用真实登记与自动打完的一局，配上伪造的「已保存」结果，
 * 让结算页的全部元素同时出现：新纪录、今日名次、打卡、两只新收集 + 一枚新称号、猜主人、
 * 下一件事（加 &invite=1 换成鱼关邀请）。不调用结算接口，不写成绩。
 */
export function ReportShowcase({ summary, registered, pets, manager, invite, onTitles, ...nav }: ReportShowcaseProps) {
  const score = summary.score;
  const save = useMemo(
    () => ({
      kind: 'saved' as const,
      newPets: pets.slice(0, 2),
      response: {
        gameId: registered.gameId,
        score,
        personalBest: { previous: Math.max(0, score - 1200), current: score, isNew: true },
        newCollected: [],
        progress: { completedNormalGames: 9, fishUnlocked: true, unlockedNow: invite, counted: true },
        quiz: pets[2]
          ? { quizId: 'showcase', petId: pets[2].id, petName: pets[2].name, options: [{ userId: 'U1', name: 'Alice' }, { userId: 'U2', name: 'Zhang Wei' }, { userId: 'U3', name: 'Sam' }] }
          : null,
        removedPetIds: [],
        newAchievements: ['dogs' as const],
        streak: { days: 3, today: true, firstToday: true },
      },
    }),
    [pets, registered.gameId, score, invite],
  );
  const loadStanding = async (): Promise<Standing> => ({ rank: 2, score, leaderScore: score + 1240, participants: 9 });
  const loadAchievements = async () => [{ id: 'cats' as const, current: 3, target: 5, unlockedAt: null }];
  const onAnswerQuiz = async (_quizId: string, choice: string | null): Promise<QuizResult> => {
    const correct = choice === 'U2';
    const bonus = correct ? 100 : 0;
    return { correct: choice === null ? null : correct, skipped: choice === null, owner: { userId: 'U2', name: 'Zhang Wei' }, bonus, score: score + bonus, personalBest: { previous: score, current: score + bonus, isNew: correct } };
  };
  return (
    <ReportScreen
      mode={registered.mode}
      summary={summary}
      pets={pets}
      save={save}
      onRetry={() => {}}
      onAnswerQuiz={onAnswerQuiz}
      manager={manager}
      loadStanding={loadStanding}
      loadAchievements={loadAchievements}
      onTitles={onTitles}
      {...nav}
    />
  );
}
