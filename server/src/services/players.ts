import type pg from 'pg';
import type { Pool } from '../db/pool.ts';
import type { SlackDirectory } from './slackDirectory.ts';
import { loadStreak } from './streak.ts';

import type { PlayerView } from '../../../web/src/api/types.ts';

export type { PlayerView };

type Queryable = Pool | pg.PoolClient;

export async function findColleague(db: Queryable, userId: string): Promise<{ userId: string; name: string } | null> {
  const { rows } = await db.query('SELECT user_id, name FROM pet_match.colleagues WHERE user_id = $1', [userId]);
  return rows[0] ? { userId: rows[0].user_id, name: rows[0].name } : null;
}

/** user_id 是否在人员表里出现过（含被其过滤掉的人）：这类人不由 Slack 补登记。 */
export async function isListed(db: Queryable, userId: string): Promise<boolean> {
  const { rowCount } = await db.query('SELECT 1 FROM public."user" WHERE user_id = $1', [userId]);
  return (rowCount ?? 0) > 0;
}

/** 名单里没有时，向 Slack 目录确认是在职同事后登记（幂等），返回是否登记成功。 */
export async function registerFromSlack(db: Queryable, directory: SlackDirectory, userId: string): Promise<boolean> {
  if (await isListed(db, userId)) return false;
  const member = await directory.get(userId);
  if (!member) return false;
  await db.query(
    'INSERT INTO pet_match.slack_members (user_id, name, email) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING',
    [member.userId, member.name, member.email],
  );
  return true;
}

export async function loadPlayer(db: Queryable, userId: string): Promise<PlayerView | null> {
  const colleague = await findColleague(db, userId);
  if (!colleague) return null;
  const best = await db.query('SELECT mode, score FROM pet_match.best_scores WHERE player_id = $1', [userId]);
  const progress = await db.query(
    `SELECT p.completed_normal_games, p.fish_unlocked_at, t.equipped_title
     FROM (SELECT $1::text AS id) s LEFT JOIN pet_match.player_progress p ON p.player_id=s.id
     LEFT JOIN pet_match.player_titles t ON t.player_id=s.id`,
    [userId],
  );
  const bestOf = (mode: string) => best.rows.find((r) => r.mode === mode)?.score ?? null;
  return {
    ...colleague,
    ...(progress.rows[0]?.equipped_title ? { equippedTitle: progress.rows[0].equipped_title } : {}),
    best: { normal: bestOf('normal'), fish: bestOf('fish') },
    progress: {
      completedNormalGames: progress.rows[0]?.completed_normal_games ?? 0,
      fishUnlocked: progress.rows[0]?.fish_unlocked_at != null,
    },
    streak: await loadStreak(db, userId),
  };
}
