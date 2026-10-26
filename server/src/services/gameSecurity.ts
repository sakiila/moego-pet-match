import type { Pool } from '../db/pool.ts';
import { inTransaction } from '../db/pool.ts';
import { GameError } from './games.ts';
import { verifyTurnstile, type TurnstileConfig } from './turnstile.ts';
import { sameToken, tokenHash } from './gameToken.ts';

export async function startVerifiedGame(pool: Pool, gameId: string, playerId: string, token: string, playToken: string, config: TurnstileConfig, now = new Date()) {
  const before = (await pool.query('SELECT * FROM pet_match.games WHERE game_id = $1', [gameId])).rows[0];
  if (!before || before.player_id !== playerId) throw new GameError('not_found', 'game');
  if (!before.requires_verification) throw new GameError('invalid', 'legacy_game');
  if (before.invalidated_at) throw new GameError('invalid', 'game_invalidated');
  if (before.started_at) {
    if (!sameToken(before.play_token_hash, playToken)) throw new GameError('conflict', 'already_started');
    return { startedAt: new Date(before.started_at).toISOString() };
  }
  if (now.getTime() - new Date(before.created_at).getTime() > 15 * 60_000) throw new GameError('invalid', 'prepare_expired');
  if (!await verifyTurnstile(config, token, gameId)) throw new GameError('verification_failed');
  return inTransaction(pool, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['game-start:' + playerId]);
    const game = (await client.query('SELECT * FROM pet_match.games WHERE game_id = $1 FOR UPDATE', [gameId])).rows[0];
    if (game.invalidated_at) throw new GameError('invalid', 'game_proof');
    if (game.started_at) {
      if (!sameToken(game.play_token_hash, playToken)) throw new GameError('conflict', 'already_started');
      return { startedAt: new Date(game.started_at).toISOString() };
    }
    // 新开局作废该玩家先前尚未保存的局；同一账号不能并行刷多个有效成绩。
    await client.query(`UPDATE pet_match.games g SET invalidated_at = $2
      WHERE player_id = $1 AND game_id <> $3 AND requires_verification AND started_at IS NOT NULL AND invalidated_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM pet_match.game_results r WHERE r.game_id = g.game_id)`, [playerId, now, gameId]);
    await client.query('UPDATE pet_match.games SET started_at = $2, play_token_hash = $3 WHERE game_id = $1', [gameId, now, tokenHash(playToken)]);
    return { startedAt: now.toISOString() };
  });
}

/** 固定窗口原子计数；每个玩家的三种写操作分别计数。 */
export async function checkGameRate(pool: Pool, bucket: string, limit: number, now = new Date()): Promise<number | null> {
  const window = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const { rows } = await pool.query(`INSERT INTO pet_match.game_request_limits (bucket, window_start, requests) VALUES ($1,$2,1)
    ON CONFLICT (bucket) DO UPDATE SET
      requests = CASE WHEN game_request_limits.window_start = EXCLUDED.window_start THEN LEAST(game_request_limits.requests + 1, 1000000) ELSE 1 END,
      window_start = EXCLUDED.window_start RETURNING requests`, [bucket, window]);
  return rows[0].requests > limit ? Math.max(1, Math.ceil((window.getTime() + 60_000 - now.getTime()) / 1000)) : null;
}
