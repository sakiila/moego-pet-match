import { createHmac, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { createGame, getSummary, trySwap } from '../../../web/src/engine/game.ts';
import { PLAY, RULES } from '../../../web/src/engine/config.ts';
import type { GameState } from '../../../web/src/engine/types.ts';
import { toResultPayload } from '../../../web/src/game/result.ts';
import type { GameMove, LiveMoveResponse, ResultPayload } from '../../../web/src/api/types.ts';
import { inTransaction, type Pool } from '../db/pool.ts';
import { GameError } from './games.ts';
import { GameMovesSchema } from './gameReplay.ts';
import { sameToken } from './gameToken.ts';

/** 服务端执棋最多受理的交换数，与整局回放上限一致。 */
const MAX_MOVES = 400;

export const LiveMoveSchema = GameMovesSchema.element;

export const newRefillKey = () => randomBytes(32);

/**
 * 第 index 步的补落随机状态：由每局私密 refill_key 派生，前端拿不到，
 * 因此无法预知任何一步之后的补落；即使从已打完的步骤反推出某步状态，也推不出下一步。
 */
export function moveRngState(key: Buffer, index: number): number {
  return createHmac('sha256', key).update(`move:${index}`).digest().readUInt32BE(0);
}

/** 下发给前端的棋局：去掉随机数状态。 */
export const publicState = (state: GameState): GameState => ({ ...state, rngState: 0 });

interface LiveGame {
  seed: number;
  lineup: string[];
  play_state: GameState | null;
}

const currentState = (g: LiveGame) => g.play_state ?? createGame({ seed: g.seed, lineup: g.lineup });

const sameMove = (a: GameMove, b: GameMove) =>
  a.at === b.at && a.from.r === b.from.r && a.from.c === b.from.c && a.to.r === b.to.r && a.to.c === b.to.c;

/**
 * 受理正式局的一次交换：按服务端保存的棋局结算，并核对走子时刻与真实开局时间。
 * index 为本局第几次交换（从 0 起）；与最后一步相同的重试原样返回上次结果。
 */
export async function playLiveMove(
  pool: Pool,
  gameId: string,
  playerId: string,
  token: string | undefined,
  index: number,
  move: GameMove,
  now = new Date(),
): Promise<LiveMoveResponse> {
  return inTransaction(pool, async (client) => {
    const g = (await client.query('SELECT * FROM pet_match.games WHERE game_id = $1 FOR UPDATE', [gameId])).rows[0];
    if (!g || g.player_id !== playerId) throw new GameError('not_found', 'game');
    if (!g.live) throw new GameError('invalid', 'not_live');
    if (!g.started_at || !sameToken(g.play_token_hash, token)) throw new GameError('invalid', 'game_proof');
    if (g.invalidated_at) throw new GameError('invalid', 'game_invalidated');
    const settled = await client.query('SELECT 1 FROM pet_match.game_results WHERE game_id = $1', [gameId]);
    if (settled.rowCount) throw new GameError('conflict', 'settled');

    const moves: GameMove[] = g.play_moves;
    if (index === moves.length - 1 && sameMove(moves[index], move)) return g.play_last as LiveMoveResponse;
    if (index !== moves.length) throw new GameError('conflict', 'move_index');
    if (moves.length >= MAX_MOVES) throw new GameError('invalid', 'too_many_moves');

    // 游戏时钟只会因系统洗牌比墙钟慢；领先墙钟是伪造时刻，落后太多是在场外拖时间思考。
    const wall = now.getTime() - new Date(g.started_at).getTime();
    if (move.at > wall + PLAY.leadMs) throw new GameError('invalid', 'move_ahead');
    if (move.at < wall - g.pause_ms - PLAY.lagMs) throw new GameError('invalid', 'move_late');

    const state = { ...currentState(g), rngState: moveRngState(g.refill_key, index) };
    const result = trySwap(state, move.from, move.to, move.at);
    if (!result.ok) throw new GameError('invalid', 'move_rejected');
    const shuffled = result.timeline.kind === 'chain' && result.timeline.shuffled !== null;
    const response: LiveMoveResponse = { state: publicState(result.state), timeline: result.timeline };
    await client.query(
      `UPDATE pet_match.games SET play_state = $2, play_moves = play_moves || $3::jsonb, play_last = $4, pause_ms = pause_ms + $5 WHERE game_id = $1`,
      [gameId, result.state, JSON.stringify([move]), response, shuffled ? PLAY.shufflePauseMs : 0],
    );
    return response;
  });
}

/** 正式局结算：以服务端保存的棋局为准，核对前端提交的全部成绩字段（走法记录不参与比较）。 */
export function validateLive(g: LiveGame & { rules_version: number }, payload: ResultPayload): { valid: false } | { valid: true; endMs: number } {
  const state = currentState(g);
  const expected = toResultPayload(getSummary(state), g.rules_version);
  for (const key of Object.keys(expected) as (keyof ResultPayload)[]) {
    if (JSON.stringify(expected[key]) !== JSON.stringify(payload[key])) return { valid: false };
  }
  return { valid: true, endMs: Math.max(RULES.durationMs, state.busyUntil) };
}

export const LiveMoveBody = z.object({ playerId: z.string().min(1).max(80), index: z.number().int().min(0).max(MAX_MOVES), move: LiveMoveSchema });
