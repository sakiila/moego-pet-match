import { api } from '../api/client';
import type { DailyManager, RegisteredGame, SettleResponse } from '../api/types';
import type { GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { toResultPayload } from '../game/result';
import { usePetDetail } from '../game/usePetDetail';
import { useResultSubmission } from '../game/useResultSubmission';
import { PetDetailOverlay } from './PetDetailOverlay';
import { ReportScreen } from './ReportScreen';

export interface LiveReportProps {
  summary: GameSummary;
  registered: RegisteredGame;
  pets: PetInfo[];
  playerId: string;
  manager: DailyManager | null;
  onSaved: (response: SettleResponse) => void;
  onPlayAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
  onCollection: () => void;
  onFishInvite: () => void;
  onOpenShop: () => void;
}

/** 报告页 + 提交：进入即提交一次，失败可在本页重试；竞猜作答归属原对局玩家；新收集卡打开图鉴详情。 */
export function LiveReport({ summary, registered, pets, playerId, onSaved, onOpenShop, ...nav }: LiveReportProps) {
  const { state, retry } = useResultSubmission(registered.gameId, playerId, toResultPayload(summary, registered.rulesVersion), onSaved);
  const detail = usePetDetail(playerId);
  return (
    <>
      <ReportScreen
        mode={registered.mode}
        summary={summary}
        pets={pets}
        save={state}
        onRetry={retry}
        onAnswerQuiz={(quizId, choice) => api.answerQuiz(quizId, playerId, choice)}
        onOpenPet={(pet) => void detail.show(pet.id, pet.name)}
        {...nav}
      />
      <PetDetailOverlay pet={detail.open} playerId={playerId} onClose={detail.close} onRetry={detail.show} onOpenShop={onOpenShop} />
    </>
  );
}
