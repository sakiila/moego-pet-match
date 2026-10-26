import type pg from 'pg';
import { inTransaction, type Pool } from '../db/pool.ts';
import type { PawBookView, PawMessage, PawNotices, PetPaw } from '../../../web/src/api/types.ts';

type Db = Pick<pg.PoolClient, 'query'>;
type Access = { pet_id: string; name: string; owner_user_id: string | null };
export class PawError extends Error {
  constructor(readonly status: 400 | 404 | 409) { super(`pet_paw_${status}`); }
}

async function access(db: Db, petId: string, playerId: string): Promise<Access> {
  const { rows } = await db.query(`SELECT p.pet_id,p.name,p.owner_user_id FROM pet_match.pets p
    JOIN pet_match.colleagues viewer ON viewer.user_id=$2
    WHERE p.pet_id=$1 AND p.status='published' AND (p.owner_user_id=$2 OR EXISTS
      (SELECT 1 FROM pet_match.collections c WHERE c.pet_id=p.pet_id AND c.player_id=$2))`, [petId, playerId]);
  if (!rows[0]) throw new PawError(404);
  return rows[0];
}

// 所有展示和通知共用上架、名册、收集与非自家过滤，避免数量和列表口径漂移。
const VISIBLE = `FROM pet_match.pet_paws w JOIN pet_match.pets p ON p.pet_id=w.pet_id AND p.status='published'
  JOIN pet_match.colleagues c ON c.user_id=w.player_id
  JOIN pet_match.collections collected ON collected.pet_id=w.pet_id AND collected.player_id=w.player_id
  LEFT JOIN pet_match.colleagues responder ON responder.user_id=w.reply_owner_id
  WHERE w.message IS NOT NULL AND w.player_id IS DISTINCT FROM p.owner_user_id`;
const FIELDS = `w.*,c.name AS sender_name,responder.name AS responder_name`;

function toPaw(row: pg.QueryResultRow, viewerId: string, own: boolean): PetPaw {
  return { id: row.paw_id, sender: { userId: row.player_id, name: row.sender_name },
    message: row.message, version: row.version, createdAt: new Date(row.created_at).toISOString(),
    reply: row.replied_at && row.responder_name ? { owner: { userId: row.reply_owner_id, name: row.responder_name }, at: new Date(row.replied_at).toISOString() } : null,
    unreadMessage: own && !row.owner_seen,
    unreadReply: row.player_id === viewerId && !!row.responder_name && !!row.replied_at && !row.reply_seen };
}

async function readBook(db: Db, pet: Access, viewerId: string, cursor: string | null = null, limit = 20): Promise<PawBookView> {
  const own = pet.owner_user_id === viewerId;
  const totals = (await db.query(`SELECT count(*)::int AS n,
    count(*) FILTER (WHERE p.owner_user_id=$2 AND NOT w.owner_seen)::int AS unread
    ${VISIBLE} AND w.pet_id=$1`, [pet.pet_id, viewerId])).rows[0];
  const mineRow = (await db.query(`SELECT ${FIELDS} ${VISIBLE} AND w.pet_id=$1 AND w.player_id=$2`, [pet.pet_id, viewerId])).rows[0];
  const version = (await db.query('SELECT version FROM pet_match.pet_paws WHERE pet_id=$1 AND player_id=$2', [pet.pet_id, viewerId])).rows[0]?.version ?? 0;
  const { rows } = await db.query(`SELECT ${FIELDS} ${VISIBLE} AND w.pet_id=$1 AND w.player_id<>$2
    AND ($3::bigint IS NULL OR w.paw_id<$3) ORDER BY w.paw_id DESC LIMIT $4`, [pet.pet_id, viewerId, cursor, limit + 1]);
  const entries = rows.slice(0, limit).map(row => toPaw(row, viewerId, own));
  return { petId: pet.pet_id, petName: pet.name, own, count: totals.n, unreadCount: totals.unread,
    mine: mineRow ? toPaw(mineRow, viewerId, own) : null, mineVersion: version,
    entries, nextCursor: rows.length > limit ? entries.at(-1)!.id : null };
}

export function loadPawBook(pool: Pool, petId: string, viewerId: string, cursor: string | null) {
  return inTransaction(pool, async db => {
    await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    return readBook(db, await access(db, petId, viewerId), viewerId, cursor);
  });
}

/** 一个宠物的写入与正式下架按相同锁顺序串行；版本处理跨设备的过期请求。 */
export function changePetPaw(pool: Pool, petId: string, viewerId: string, message: PawMessage | null, version: number, limit = 20) {
  return inTransaction(pool, async db => {
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended('pet-paw:' || $1,0))", [petId]);
    const pet = await access(db, petId, viewerId);
    if (pet.owner_user_id === viewerId) throw new PawError(400);
    const current = (await db.query('SELECT * FROM pet_match.pet_paws WHERE pet_id=$1 AND player_id=$2', [petId, viewerId])).rows[0];
    if ((current?.message ?? null) === message) return readBook(db, pet, viewerId, null, limit);
    if ((current?.version ?? 0) !== version) throw new PawError(409);
    if (!current) {
      await db.query('INSERT INTO pet_match.pet_paws(pet_id,player_id,message) VALUES($1,$2,$3)', [petId, viewerId, message]);
    } else {
      await db.query(`UPDATE pet_match.pet_paws SET message=$2,version=version+1,
        owner_seen=CASE WHEN $2::text IS NULL THEN true ELSE owner_seen END,
        reply_owner_id=CASE WHEN $2::text IS NULL THEN NULL ELSE reply_owner_id END,
        replied_at=CASE WHEN $2::text IS NULL THEN NULL ELSE replied_at END,
        reply_seen=CASE WHEN $2::text IS NULL THEN true ELSE reply_seen END WHERE paw_id=$1`, [current.paw_id, message]);
    }
    return readBook(db, pet, viewerId, null, limit);
  });
}

export function replyPetPaw(pool: Pool, petId: string, ownerId: string, pawId: string, version: number, limit = 20) {
  return inTransaction(pool, async db => {
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended('pet-paw:' || $1,0))", [petId]);
    const pet = await access(db, petId, ownerId);
    if (pet.owner_user_id !== ownerId) throw new PawError(400);
    const current = (await db.query(`SELECT w.* ${VISIBLE} AND w.pet_id=$1 AND w.paw_id=$2`, [petId, pawId])).rows[0];
    if (!current) throw new PawError(409);
    if (!current.replied_at) {
      if (current.version !== version) throw new PawError(409);
      await db.query(`UPDATE pet_match.pet_paws SET reply_owner_id=$2,replied_at=now(),version=version+1,
        reply_seen=ever_replied,ever_replied=true WHERE paw_id=$1`, [pawId, ownerId]);
    }
    return readBook(db, pet, ownerId, null, limit);
  });
}

export async function readPetPaws(pool: Pool, petId: string, viewerId: string, ids: string[], kind: 'message' | 'reply') {
  return inTransaction(pool, async db => {
    const pet = await access(db, petId, viewerId);
    if (kind === 'message' && pet.owner_user_id !== viewerId) throw new PawError(400);
    if (kind === 'reply' && pet.owner_user_id === viewerId) throw new PawError(400);
    if (kind === 'message') {
      await db.query(`UPDATE pet_match.pet_paws SET owner_seen=true WHERE pet_id=$1 AND paw_id=ANY($2::bigint[])`, [petId, ids]);
    } else {
      await db.query(`UPDATE pet_match.pet_paws SET reply_seen=true WHERE pet_id=$1 AND player_id=$2
        AND paw_id=ANY($3::bigint[]) AND replied_at IS NOT NULL`, [petId, viewerId, ids]);
    }
    return { ok: true };
  });
}

export async function loadPawNotices(pool: Pool, viewerId: string): Promise<PawNotices> {
  if (!(await pool.query('SELECT 1 FROM pet_match.colleagues WHERE user_id=$1', [viewerId])).rowCount) throw new PawError(404);
  const { rows } = await pool.query(`SELECT p.pet_id,p.name AS pet_name,
    count(*) FILTER (WHERE p.owner_user_id=$1 AND NOT w.owner_seen)::int AS messages,
    count(*) FILTER (WHERE w.player_id=$1 AND w.replied_at IS NOT NULL AND responder.user_id IS NOT NULL AND NOT w.reply_seen)::int AS replies
    ${VISIBLE} AND (p.owner_user_id=$1 OR w.player_id=$1)
    GROUP BY p.pet_id,p.name ORDER BY p.name,p.pet_id`, [viewerId]);
  const item = (r: pg.QueryResultRow, kind: 'messages' | 'replies') => ({ petId: r.pet_id, petName: r.pet_name, count: r[kind] });
  return { messages: rows.filter(r => r.messages > 0).map(r => item(r, 'messages')),
    replies: rows.filter(r => r.replies > 0).map(r => item(r, 'replies')) };
}
