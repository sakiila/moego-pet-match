import type { Pool } from '../db/pool.ts';
import type { PlayerLikesView } from '../../../web/src/api/types.ts';

/** 只读当前有效同事；不登记新身份、不触发成就或按模式/日期分组。 */
export async function loadPlayerLikes(db: Pool, targetId: string, viewerId: string): Promise<PlayerLikesView | null> {
  const { rows } = await db.query(`SELECT
      (SELECT count(*)::int FROM pet_match.player_likes WHERE target_player_id=$1) AS received_likes,
      EXISTS (SELECT 1 FROM pet_match.player_likes WHERE source_player_id=$2 AND target_player_id=$1) AS liked_by_viewer
    FROM pet_match.colleagues target JOIN pet_match.colleagues viewer ON viewer.user_id=$2
    WHERE target.user_id=$1`, [targetId, viewerId]);
  const row = rows[0];
  return row ? {
    receivedLikes: row.received_likes,
    likedByViewer: row.liked_by_viewer,
    canLike: targetId !== viewerId && !row.liked_by_viewer,
  } : null;
}

/** 单条插入由数据库唯一键兜底；提交后另开语句读取，避免并发冲突时沿用插入前的快照。 */
export async function addPlayerLike(db: Pool, targetId: string, sourceId: string): Promise<PlayerLikesView | null> {
  await db.query(`INSERT INTO pet_match.player_likes(source_player_id,target_player_id)
    SELECT source.user_id,target.user_id
    FROM pet_match.colleagues source JOIN pet_match.colleagues target ON target.user_id=$1
    WHERE source.user_id=$2 AND source.user_id<>target.user_id
    ON CONFLICT (source_player_id,target_player_id) DO NOTHING`, [targetId, sourceId]);
  return loadPlayerLikes(db, targetId, sourceId);
}
