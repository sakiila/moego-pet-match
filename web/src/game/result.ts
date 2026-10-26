import type { ResultPayload } from '../api/types';
import type { GameSummary } from '../engine';

/** 本局冻结结果：到时收尾后由引擎事实数据生成，重试时原样复用，不重新计算。 */
export function toResultPayload(summary: GameSummary, rulesVersion: number): ResultPayload {
  return {
    rulesVersion,
    completed: true,
    score: summary.score,
    clearedCells: summary.clearedCells,
    clearedByMultiplier: [...summary.clearedByMultiplier],
    rushSucceeded: summary.rushSucceeded,
    maxChain: summary.maxChain,
    toolsFired: summary.toolsFired,
    validMoves: summary.validMoves,
    actedInLastSeconds: summary.actedInLastSeconds,
    pets: summary.pets.map((p) => ({ id: p.id, served: p.served, firstServedSeq: p.firstServedSeq })),
    ...(summary.moves ? { moves: summary.moves } : {}),
  };
}
