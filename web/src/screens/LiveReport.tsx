import { useCallback, useState } from 'react';
import { api } from '../api/client';
import type { AchievementId, DailyManager, QuizResult, RegisteredGame, SettleResponse } from '../api/types';
import type { GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { toResultPayload } from '../game/result';
import { todayStanding } from '../game/standing';
import { usePetDetail } from '../game/usePetDetail';
import { useResultSubmission } from '../game/useResultSubmission';
import { ShareCardOverlay } from './ShareCardOverlay';
import { PetDetailOverlay } from './PetDetailOverlay';
import { ReportScreen } from './ReportScreen';

export interface LiveReportProps {
  summary: GameSummary;
  registered: RegisteredGame;
  pets: PetInfo[];
  playerId: string;
  /** 原对局玩家姓名（成绩卡署名）。 */
  playerName: string;
  manager: DailyManager | null;
  onSaved: (response: SettleResponse) => void;
  onPlayAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
  onCollection: () => void;
  onFishInvite: () => void;
  onOpenShop: () => void;
  equippedTitle?: AchievementId | null;
  onEquipTitle?: (id: AchievementId) => Promise<void>;
  onTitles?: () => void;
}

/** 报告页 + 提交：进入即提交一次，失败可在本页重试；竞猜作答归属原对局玩家，答对加分后分享卡用新总分；新收集卡打开图鉴详情。 */
export function LiveReport({ summary, registered, pets, playerId, playerName, onSaved, onOpenShop, ...nav }: LiveReportProps) {
  const { state, retry } = useResultSubmission(registered.gameId, playerId, toResultPayload(summary, registered.rulesVersion), onSaved);
  const detail = usePetDetail(playerId);
  const [sharing, setSharing] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const loadAchievements = useCallback(() => api.getAchievements(playerId).then((v) => v.achievements), [playerId]);
  const loadStanding = useCallback(
    () => api.getLeaderboard(registered.mode, playerId, 'today').then((view) => todayStanding(view, playerId)),
    [registered.mode, playerId],
  );
  // 答对加分后总分与最好成绩变了：分享卡用新总分，并按新结果刷新玩家资料
  const answerQuiz = async (quizId: string, choice: string | null): Promise<QuizResult> => {
    const result = await api.answerQuiz(quizId, playerId, choice);
    if (result.bonus > 0 && state.kind === 'saved') {
      setQuizScore(result.score);
      onSaved({ ...state.response, score: result.score, personalBest: result.personalBest });
    }
    return result;
  };
  return (
    <>
      <ReportScreen
        mode={registered.mode}
        summary={summary}
        pets={pets}
        save={state}
        onRetry={retry}
        onAnswerQuiz={answerQuiz}
        onOpenPet={(pet, el) => void detail.show(pet.id, pet.name, el)}
        onShare={() => setSharing(true)}
        loadStanding={loadStanding}
        loadAchievements={loadAchievements}
        {...nav}
      />
      {sharing && (
        <ShareCardOverlay
          mode={registered.mode}
          summary={summary}
          pets={pets}
          playerName={playerName}
          manager={nav.manager}
          removed={state.kind === 'saved' ? state.response.removedPetIds : []}
          score={quizScore ?? (state.kind === 'saved' ? state.response.score : undefined)}
          onClose={() => setSharing(false)}
        />
      )}
      <PetDetailOverlay pet={detail.open} playerId={playerId} onClose={detail.close} onRetry={detail.show} onOpenShop={onOpenShop} />
    </>
  );
}
