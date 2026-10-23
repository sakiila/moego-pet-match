import { api } from '../api/client';
import type { RegisteredGame, SettleResponse } from '../api/types';
import type { GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { toResultPayload } from '../game/result';
import { useResultSubmission } from '../game/useResultSubmission';
import { ReportScreen } from './ReportScreen';

export interface LiveReportProps {
  summary: GameSummary;
  registered: RegisteredGame;
  pets: PetInfo[];
  playerId: string;
  onSaved: (response: SettleResponse) => void;
  onPlayAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
  onFishInvite: () => void;
}

/** 报告页 + 提交：进入即提交一次，失败可在本页重试；竞猜作答归属原对局玩家。 */
export function LiveReport({ summary, registered, pets, playerId, onSaved, ...nav }: LiveReportProps) {
  const { state, retry } = useResultSubmission(registered.gameId, playerId, toResultPayload(summary, registered.rulesVersion), onSaved);
  return (
    <ReportScreen
      mode={registered.mode}
      summary={summary}
      pets={pets}
      save={state}
      onRetry={retry}
      onAnswerQuiz={(quizId, choice) => api.answerQuiz(quizId, playerId, choice)}
      {...nav}
    />
  );
}
