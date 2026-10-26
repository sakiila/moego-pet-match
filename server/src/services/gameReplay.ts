import { z } from 'zod';
import { createGame, getSummary, trySwap } from '../../../web/src/engine/game.ts';
import { RULES } from '../../../web/src/engine/config.ts';
import { toResultPayload } from '../../../web/src/game/result.ts';
import type { ResultPayload } from '../../../web/src/api/types.ts';

const pos = z.object({ r: z.number().int().min(0).max(RULES.size - 1), c: z.number().int().min(0).max(RULES.size - 1) }).strict();
export const GameMovesSchema = z.array(z.object({ at: z.number().int().min(0).max(RULES.durationMs - 1), from: pos, to: pos }).strict()).max(400);

/** 只用服务端保存的 seed、阵容、规则重演；不信任客户端的分数或汇总事实。 */
export function validateReplay(game: { seed: number; lineup: string[]; rules_version: number }, payload: ResultPayload): { valid: false } | { valid: true; endMs: number } {
  const parsed = GameMovesSchema.safeParse(payload.moves);
  if (!parsed.success) return { valid: false };
  let state = createGame({ seed: game.seed, lineup: game.lineup });
  let previous = -1;
  for (const move of parsed.data) {
    if (move.at <= previous) return { valid: false };
    const result = trySwap(state, move.from, move.to, move.at);
    if (!result.ok) return { valid: false };
    state = result.state;
    previous = move.at;
  }
  const expected = toResultPayload(getSummary(state), game.rules_version);
  for (const key of Object.keys(expected) as (keyof ResultPayload)[]) {
    if (JSON.stringify(expected[key]) !== JSON.stringify(payload[key])) return { valid: false };
  }
  return { valid: true, endMs: Math.max(RULES.durationMs, state.busyUntil) };
}
