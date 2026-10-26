import type { PlayerPet } from '../../../web/src/api/types.ts';
import type { Pool } from '../db/pool.ts';

/** 名片中的自家宠物：归属按被查看玩家，收集状态按查看者；不返回照片、名言或申请记录。 */
export async function loadPlayerPets(pool: Pool, ownerId: string, viewerId: string): Promise<PlayerPet[]> {
  const { rows } = await pool.query(`
    SELECT p.pet_id, p.name, col.pet_id IS NOT NULL AS collected
    FROM pet_match.pets p
    LEFT JOIN pet_match.collections col ON col.pet_id=p.pet_id AND col.player_id=$2
    WHERE p.owner_user_id=$1 AND p.status='published'
    ORDER BY p.name, p.pet_id`, [ownerId, viewerId]);
  return rows.map(row => ({ petId: row.pet_id, name: row.name, collected: row.collected }));
}
