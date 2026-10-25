import type { Pool } from '../db/pool.ts';
import type { GameMode, PlayerProfileView } from '../../../web/src/api/types.ts';
import { ACHIEVEMENT_IDS } from '../../../web/src/game/achievementRules.ts';
import { findColleague } from './players.ts';

/** 只读公开资料；不调用会补发成就或登记 Slack 同事的身份接口。 */
export async function loadPlayerProfile(db: Pool, userId: string, mode: GameMode): Promise<PlayerProfileView | null> {
  const colleague = await findColleague(db, userId);
  if (!colleague) return null;
  const [stats, collection, titles, recent] = await Promise.all([
    db.query(`SELECT count(*)::int AS games, max(r.score) AS best
      FROM pet_match.games g JOIN pet_match.game_results r USING(game_id)
      WHERE g.player_id=$1 AND g.mode=$2`, [userId,mode]),
    db.query(`SELECT count(*)::int AS total, count(c.pet_id)::int AS collected
      FROM pet_match.pets p LEFT JOIN pet_match.collections c ON c.pet_id=p.pet_id AND c.player_id=$1
      WHERE p.status='published'`, [userId]),
    db.query(`SELECT a.achievement_id, t.equipped_title
      FROM pet_match.achievement_awards a LEFT JOIN pet_match.player_titles t ON t.player_id=a.player_id
      WHERE a.player_id=$1`, [userId]),
    db.query(`SELECT r.game_id,r.created_at,r.score,
      (SELECT count(*)::int FROM pet_match.collections c JOIN pet_match.pets p USING(pet_id)
       WHERE c.first_game_id=r.game_id AND c.player_id=$1 AND p.status='published') AS new_collected
      FROM pet_match.games g JOIN pet_match.game_results r USING(game_id)
      WHERE g.player_id=$1 AND g.mode=$2 ORDER BY r.created_at DESC,r.game_id DESC LIMIT 5`, [userId,mode]),
  ]);
  const unlockedTitles = ACHIEVEMENT_IDS.filter(id => titles.rows.some(row => row.achievement_id === id));
  const equipped = titles.rows[0]?.equipped_title;
  return {
    ...colleague, mode,
    bestScore: stats.rows[0].best == null ? null : Number(stats.rows[0].best),
    completedGames: Number(stats.rows[0].games),
    collection: { collected:Number(collection.rows[0].collected), total:Number(collection.rows[0].total) },
    unlockedTitles,
    equippedTitle: unlockedTitles.find(id => id === equipped) ?? null,
    recentGames: recent.rows.map(row => ({gameId:row.game_id,completedAt:new Date(row.created_at).toISOString(),score:Number(row.score),newCollected:Number(row.new_collected)})),
  };
}
