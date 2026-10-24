import type pg from 'pg';
import type { Streak } from '../../../web/src/api/types.ts';
import type { Pool } from '../db/pool.ts';
import { beijingDate } from './pets.ts';

type Queryable = Pool | pg.PoolClient;

/** YYYY-MM-DD 前一天（按 UTC 算日历，日期串本身不带时区）。 */
export function previousDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

/**
 * 连续开工天数：dates 为有过有效操作的已保存对局的登记日期（可乱序、可重复）。
 * 今天开过工就从今天往前数相邻日子；今天没开、昨天开过则从昨天数（today=false，待续）；
 * 昨天也没开则归零。
 */
export function computeStreak(dates: readonly string[], today: string): Streak {
  const set = new Set(dates);
  const playedToday = set.has(today);
  let cursor = playedToday ? today : previousDay(today);
  if (!set.has(cursor)) return { days: 0, today: false };
  let days = 0;
  while (set.has(cursor)) {
    days++;
    cursor = previousDay(cursor);
  }
  return { days, today: playedToday };
}

/** 该玩家有过有效操作的已保存对局的登记日期，倒序去重，最多取最近 400 天。 */
export async function playedDates(db: Queryable, playerId: string): Promise<string[]> {
  const { rows } = await db.query(
    `SELECT DISTINCT g.board_date::text AS d
     FROM pet_match.games g JOIN pet_match.game_results r ON r.game_id = g.game_id
     WHERE g.player_id = $1 AND coalesce((r.payload->>'validMoves')::int, 0) > 0
     ORDER BY d DESC LIMIT 400`,
    [playerId],
  );
  return rows.map((r) => r.d as string);
}

export async function loadStreak(db: Queryable, playerId: string, now = new Date()): Promise<Streak> {
  return computeStreak(await playedDates(db, playerId), beijingDate(now));
}
