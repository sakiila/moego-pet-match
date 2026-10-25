import type { DeletionRequestView, MyPet } from '../../../web/src/api/types.ts';
import { inTransaction, type Pool } from '../db/pool.ts';

export const DELETION_NOTE_MAX = 1000;

export class DeletionError extends Error {
  constructor(readonly code: 'not_found' | 'forbidden') {
    super(code);
  }
}

/** 我的宠物：只列本人已上架的宠物，带本人收集状态与该宠物最近一条申请状态。 */
export async function listMyPets(pool: Pool, playerId: string): Promise<MyPet[]> {
  const { rows } = await pool.query(
    `SELECT p.pet_id, p.name,
            EXISTS (SELECT 1 FROM pet_match.collections col WHERE col.pet_id = p.pet_id AND col.player_id = $1) AS collected,
            (SELECT d.status FROM pet_match.deletion_requests d WHERE d.pet_id = p.pet_id ORDER BY d.created_at DESC LIMIT 1) AS request_status
       FROM pet_match.pets p
      WHERE p.owner_user_id = $1 AND p.status = 'published'
      ORDER BY p.name`,
    [playerId],
  );
  return rows.map((r) => ({ petId: r.pet_id, name: r.name, collected: r.collected, request: r.request_status ? { status: r.request_status } : null }));
}

/**
 * 提交删除申请：只记为待处理，不自动隐藏或下架。宠物申请只接受本人已上架的宠物；
 * 同一只宠物已有待处理申请时返回原申请，不重复创建。petId 为空为一般申请。
 */
export async function createDeletionRequest(pool: Pool, input: { playerId: string; petId: string | null; note: string | null }) {
  return inTransaction(pool, async (client) => {
    if (input.petId) {
      const pet = (await client.query('SELECT owner_user_id, status FROM pet_match.pets WHERE pet_id = $1 FOR SHARE', [input.petId])).rows[0];
      if (!pet || pet.status !== 'published') throw new DeletionError('not_found');
      if (pet.owner_user_id !== input.playerId) throw new DeletionError('forbidden');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('deletion:' || $1))", [input.petId]);
      const open = (await client.query(`SELECT request_id FROM pet_match.deletion_requests WHERE pet_id = $1 AND status = 'pending' LIMIT 1`, [input.petId])).rows[0];
      if (open) return { requestId: open.request_id as string, status: 'pending' as const, created: false };
    }
    const { rows } = await client.query(
      `INSERT INTO pet_match.deletion_requests (player_id, pet_id, note) VALUES ($1, $2, $3) RETURNING request_id`,
      [input.playerId, input.petId, input.note],
    );
    return { requestId: rows[0].request_id as string, status: 'pending' as const, created: true };
  });
}

/** 本人提交过的申请（新的在前）；宠物已下架时不再返回宠物名。 */
export async function listDeletionRequests(pool: Pool, playerId: string): Promise<DeletionRequestView[]> {
  const { rows } = await pool.query(
    `SELECT d.request_id, d.pet_id, CASE WHEN p.status = 'published' THEN p.name END AS pet_name, d.status, d.created_at
       FROM pet_match.deletion_requests d LEFT JOIN pet_match.pets p ON p.pet_id = d.pet_id
      WHERE d.player_id = $1
      ORDER BY d.created_at DESC`,
    [playerId],
  );
  return rows.map((r) => ({
    requestId: r.request_id,
    petId: r.pet_id,
    petName: r.pet_name ?? null,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}
