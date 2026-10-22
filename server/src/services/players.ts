import type pg from 'pg';
import type { Pool } from '../db/pool.ts';

import type { PlayerView } from '../../../web/src/api/types.ts';

export type { PlayerView };

type Queryable = Pool | pg.PoolClient;

export async function findColleague(db: Queryable, userId: string): Promise<{ userId: string; name: string } | null> {
  const { rows } = await db.query('SELECT user_id, name FROM pet_match.colleagues WHERE user_id = $1', [userId]);
  return rows[0] ? { userId: rows[0].user_id, name: rows[0].name } : null;
}

export async function loadPlayer(db: Queryable, userId: string): Promise<PlayerView | null> {
  const colleague = await findColleague(db, userId);
  if (!colleague) return null;
  const best = await db.query('SELECT mode, score FROM pet_match.best_scores WHERE player_id = $1', [userId]);
  const progress = await db.query(
    'SELECT completed_normal_games, fish_unlocked_at FROM pet_match.player_progress WHERE player_id = $1',
    [userId],
  );
  const bestOf = (mode: string) => best.rows.find((r) => r.mode === mode)?.score ?? null;
  return {
    ...colleague,
    best: { normal: bestOf('normal'), fish: bestOf('fish') },
    progress: {
      completedNormalGames: progress.rows[0]?.completed_normal_games ?? 0,
      fishUnlocked: progress.rows[0]?.fish_unlocked_at != null,
    },
  };
}
