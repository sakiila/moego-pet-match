import type { RegisteredGame, SettleResponse } from '../api/types';
import type { GameSummary } from '../engine';
import { toResultPayload } from '../game/result';
import { useResultSubmission } from '../game/useResultSubmission';
import { ReportScreen } from './ReportScreen';

export interface LiveReportProps {
  summary: GameSummary;
  registered: RegisteredGame;
  playerId: string;
  onSaved: (response: SettleResponse) => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

/** 报告页 + 提交：进入即提交一次，失败可在本页重试。 */
export function LiveReport({ summary, registered, playerId, onSaved, onPlayAgain, onHome }: LiveReportProps) {
  const { state, retry } = useResultSubmission(registered.gameId, playerId, toResultPayload(summary, registered.rulesVersion), onSaved);
  return <ReportScreen summary={summary} save={state} onRetry={retry} onPlayAgain={onPlayAgain} onHome={onHome} />;
}
