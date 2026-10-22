import { createHash, randomInt } from 'node:crypto';
import type pg from 'pg';
import { z } from 'zod';
import type { GameMode, LineupPet, RegisteredGame, ResultPayload, SettleResponse } from '../../../web/src/api/types.ts';
import { RULES, RULES_VERSION } from '../../../web/src/engine/config.ts';
import { inTransaction, type Pool } from '../db/pool.ts';
import { findColleague, loadPlayer } from './players.ts';

/** 第几局普通完整局后解锁 Peter 鱼关。 */
export const FISH_UNLOCK_GAMES = 3;

export class GameError extends Error {
  constructor(
    readonly code: 'not_found' | 'locked' | 'not_ready' | 'invalid' | 'conflict',
    readonly detail?: string,
  ) {
    super(code);
  }
}

/** 登记新局：确认身份在名单内（鱼局需已解锁），服务端定种子并抽 6 只上架宠物。 */
export async function registerGame(pool: Pool, playerId: string, mode: GameMode): Promise<RegisteredGame> {
  const player = await loadPlayer(pool, playerId);
  if (!player) throw new GameError('not_found', 'player');
  if (mode === 'fish' && !player.progress.fishUnlocked) throw new GameError('locked');
  // 阶段 2：均匀抽样；自家优先与未收集倾向在阶段 3 接入
  const { rows } = await pool.query(
    `SELECT pet_id, name FROM pet_match.pets WHERE status = 'published' ORDER BY random() LIMIT $1`,
    [RULES.kinds],
  );
  if (rows.length < RULES.kinds) throw new GameError('not_ready', 'not enough published pets');
  const lineup: LineupPet[] = rows.map((r) => ({ petId: r.pet_id, name: r.name }));
  const seed = randomInt(0, 2 ** 31 - 1);
  const inserted = await pool.query(
    `INSERT INTO pet_match.games (player_id, mode, rules_version, seed, lineup) VALUES ($1, $2, $3, $4, $5) RETURNING game_id`,
    [playerId, mode, RULES_VERSION, seed, lineup.map((p) => p.petId)],
  );
  return { gameId: inserted.rows[0].game_id, seed, rulesVersion: RULES_VERSION, mode, lineup };
}

const count = z.number().int().min(0);
export const ResultPayloadSchema = z
  .object({
    rulesVersion: z.number().int(),
    completed: z.literal(true),
    score: count,
    clearedCells: count,
    clearedByMultiplier: z.array(count).length(RULES.maxMultiplier),
    rushSucceeded: z.boolean(),
    maxChain: count,
    toolsFired: count,
    validMoves: count,
    actedInLastSeconds: z.boolean(),
    pets: z.array(z.object({ id: z.string().min(1), served: count, firstServedSeq: count.nullable() })).length(RULES.kinds),
  })
  .strict();

/** 基础校验：只检查结果自洽，不重演棋盘。返回不通过的原因或 null。 */
export function checkConsistency(p: ResultPayload, lineup: string[], rulesVersion: number): string | null {
  if (p.rulesVersion !== rulesVersion) return 'rules_version';
  const ids = p.pets.map((x) => x.id);
  if (new Set(ids).size !== ids.length || ids.some((id) => !lineup.includes(id))) return 'lineup';
  const byMult = p.clearedByMultiplier.reduce((sum, n) => sum + n, 0);
  if (byMult !== p.clearedCells) return 'cleared_cells';
  const expected =
    p.clearedByMultiplier.reduce((sum, n, i) => sum + n * (i + 1) * RULES.baseScore, 0) + (p.rushSucceeded ? RULES.rush.bonus : 0);
  if (expected !== p.score) return 'score';
  if (p.pets.reduce((sum, x) => sum + x.served, 0) > p.clearedCells) return 'served';
  if (p.pets.some((x) => (x.served === 0) !== (x.firstServedSeq === null))) return 'first_served';
  if (p.validMoves === 0 && (p.clearedCells > 0 || p.rushSucceeded)) return 'no_moves';
  return null;
}

/** 规范化 JSON（键排序）后取哈希，用于判断重试是否同一份结果。 */
export function payloadHash(p: ResultPayload): string {
  const canonical = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, canonical((v as Record<string, unknown>)[k])]))
        : v;
  return createHash('sha256').update(JSON.stringify(canonical(p))).digest('hex');
}

export interface SettleHooks {
  /** 测试用：在事务中途注入失败。 */
  beforeCommit?: (client: pg.PoolClient) => Promise<void>;
}

/**
 * 统一结算：对局、个人最好、图鉴、个人局数与鱼关解锁在同一事务中保存。
 * 先锁住对局行，再判断是否已结算，保证并发与重试都只记一次。
 */
export async function settleGame(
  pool: Pool,
  gameId: string,
  playerId: string,
  payload: ResultPayload,
  hooks: SettleHooks = {},
): Promise<SettleResponse> {
  const hash = payloadHash(payload);
  return inTransaction(pool, async (client) => {
    const game = await client.query('SELECT * FROM pet_match.games WHERE game_id = $1 FOR UPDATE', [gameId]);
    const g = game.rows[0];
    if (!g) throw new GameError('not_found', 'game');
    if (g.player_id !== playerId) throw new GameError('conflict', 'player');

    const existing = await client.query('SELECT payload_hash, response FROM pet_match.game_results WHERE game_id = $1', [gameId]);
    if (existing.rows[0]) {
      if (existing.rows[0].payload_hash !== hash) throw new GameError('conflict', 'different_result');
      return existing.rows[0].response as SettleResponse;
    }

    const reason = checkConsistency(payload, g.lineup, g.rules_version);
    if (reason) throw new GameError('invalid', reason);
    if (!(await findColleague(client, playerId))) throw new GameError('not_found', 'player');

    const mode: GameMode = g.mode;
    const counted = mode === 'normal' && payload.validMoves > 0;

    const best = await client.query('SELECT score FROM pet_match.best_scores WHERE player_id = $1 AND mode = $2 FOR UPDATE', [playerId, mode]);
    const previous: number | null = best.rows[0]?.score ?? null;
    const isNew = previous === null || payload.score > previous;
    if (isNew) {
      await client.query(
        `INSERT INTO pet_match.best_scores (player_id, mode, score, game_id, achieved_at) VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (player_id, mode) DO UPDATE SET score = EXCLUDED.score, game_id = EXCLUDED.game_id, achieved_at = now()`,
        [playerId, mode, payload.score, gameId],
      );
    }

    let newCollected: LineupPet[] = [];
    if (mode === 'normal') {
      const served = payload.pets.filter((p) => p.served > 0).map((p) => p.id);
      if (served.length) {
        const inserted = await client.query(
          `INSERT INTO pet_match.collections (player_id, pet_id, first_game_id)
           SELECT $1, unnest($2::text[]), $3
           ON CONFLICT (player_id, pet_id) DO NOTHING
           RETURNING pet_id`,
          [playerId, served, gameId],
        );
        const ids = inserted.rows.map((r) => r.pet_id);
        if (ids.length) {
          const names = await client.query('SELECT pet_id, name FROM pet_match.pets WHERE pet_id = ANY($1)', [ids]);
          newCollected = ids.map((id) => ({ petId: id, name: names.rows.find((r) => r.pet_id === id)?.name ?? id }));
        }
      }
    }

    await client.query(
      `INSERT INTO pet_match.player_progress (player_id) VALUES ($1) ON CONFLICT (player_id) DO NOTHING`,
      [playerId],
    );
    const progressRow = await client.query(
      'SELECT completed_normal_games, fish_unlocked_at FROM pet_match.player_progress WHERE player_id = $1 FOR UPDATE',
      [playerId],
    );
    let completed: number = progressRow.rows[0].completed_normal_games;
    let fishUnlocked = progressRow.rows[0].fish_unlocked_at != null;
    let unlockedNow = false;
    if (counted) {
      completed += 1;
      unlockedNow = !fishUnlocked && completed >= FISH_UNLOCK_GAMES;
      fishUnlocked = fishUnlocked || unlockedNow;
      await client.query(
        `UPDATE pet_match.player_progress
         SET completed_normal_games = $2, fish_unlocked_at = CASE WHEN $3 THEN now() ELSE fish_unlocked_at END, updated_at = now()
         WHERE player_id = $1`,
        [playerId, completed, unlockedNow],
      );
    }

    const response: SettleResponse = {
      gameId,
      score: payload.score,
      personalBest: { previous, current: isNew ? payload.score : previous!, isNew },
      newCollected,
      progress: { completedNormalGames: completed, fishUnlocked, unlockedNow, counted },
    };
    await client.query(
      `INSERT INTO pet_match.game_results (game_id, payload, payload_hash, score, counted, response) VALUES ($1, $2, $3, $4, $5, $6)`,
      [gameId, payload, hash, payload.score, counted, response],
    );
    await hooks.beforeCommit?.(client);
    return response;
  });
}
