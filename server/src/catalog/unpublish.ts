import type pg from 'pg';
import pgDefault from 'pg';
import { inTransaction } from '../db/pool.ts';
import type { ObjectStore } from '../storage/objectStore.ts';
import { SIZES } from './build.ts';
import type { PurgeStickerImages } from '../services/imageCdn.ts';

/** 卡背照片对象键 photos/<pet_id>/<原图哈希>.jpg 里的原图哈希：哈希相同即共用同一张原图。 */
const photoHash = (key: string | null) => key?.split('/').pop() ?? null;

export interface UnpublishPlan {
  petId: string;
  name: string;
  ownerUserId: string | null;
  /** 要删除的 R2 / 本地对象：该宠物的贴纸与卡背照片，以及共用原图的其他宠物的卡背照片。 */
  objects: string[];
  /** 共用同一张原图的其他上架宠物：它们的卡背照片一并移除（合照里有被移除的宠物）。 */
  sharedPhoto: { petId: string; name: string; photoKey: string }[];
  /** 同主人只剩一只、因此不再算一家的宠物。 */
  familyDissolves: { petId: string; name: string }[];
  /** 这只宠物当过的今日店长日期（当天会自动改选，历史记录保留墓碑引用）。 */
  managerDates: string[];
  pendingRequests: { requestId: string; playerId: string }[];
}

type Db = Pick<pg.Pool, 'query'> | pg.PoolClient | pg.Client;

/** 预览一次下架：只读，列出将要删除与改动的内容。 */
export async function planUnpublish(db: Db, petId: string): Promise<UnpublishPlan> {
  const row = (await db.query('SELECT pet_id, name, status, owner_user_id, family_id, sticker_key, photo_key FROM pet_match.pets WHERE pet_id = $1', [petId])).rows[0];
  if (!row) throw new Error(`unknown pet ${petId}`);
  if (row.status === 'removed') throw new Error(`pet ${petId} is already removed`);
  const objects = [...(row.sticker_key ? SIZES.map((s) => `${row.sticker_key}/${s}.png`) : []), ...(row.photo_key ? [row.photo_key] : [])];
  const hash = photoHash(row.photo_key);
  const sharedPhoto = hash
    ? (
        await db.query(`SELECT pet_id, name, photo_key FROM pet_match.pets WHERE pet_id <> $1 AND status <> 'removed' AND photo_key LIKE '%/' || $2`, [petId, hash])
      ).rows.map((r) => ({ petId: r.pet_id, name: r.name, photoKey: r.photo_key }))
    : [];
  const siblings = row.family_id
    ? (await db.query(`SELECT pet_id, name FROM pet_match.pets WHERE family_id = $1 AND pet_id <> $2 AND status <> 'removed'`, [row.family_id, petId])).rows
    : [];
  const managerDates = (await db.query(`SELECT to_char(manager_date, 'YYYY-MM-DD') AS d FROM pet_match.daily_managers WHERE pet_id = $1 ORDER BY 1`, [petId])).rows.map((r) => r.d);
  const pendingRequests = (await db.query(`SELECT request_id, player_id FROM pet_match.deletion_requests WHERE pet_id = $1 AND status = 'pending'`, [petId])).rows.map((r) => ({
    requestId: r.request_id,
    playerId: r.player_id,
  }));
  return {
    petId,
    name: row.name,
    ownerUserId: row.owner_user_id,
    objects: [...objects, ...sharedPhoto.map((s) => s.photoKey)],
    sharedPhoto,
    familyDissolves: siblings.length === 1 ? siblings.map((r) => ({ petId: r.pet_id, name: r.name })) : [],
    managerDates,
    pendingRequests,
  };
}

/**
 * 执行下架：先在一个事务里把记录清成墓碑（只留 pet_id、status = 'removed'、下架时间），
 * 去掉共用原图宠物的卡背照片、解散只剩一只的家庭；提交后再删对象。
 * 对象删除失败不回滚墓碑（宠物已不会再展示），返回未删掉的键，供重跑或手动处理。
 */
/** 在事务里执行：连接池取一个连接，命令行的单个连接直接用。 */
async function transaction(db: pg.Pool | pg.Client, fn: (client: pg.PoolClient | pg.Client) => Promise<void>) {
  if (db instanceof pgDefault.Pool) return inTransaction(db, fn);
  await db.query('BEGIN');
  try {
    await fn(db);
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

export async function applyUnpublish(db: pg.Pool | pg.Client, store: ObjectStore, plan: UnpublishPlan, purgeImages?: PurgeStickerImages): Promise<{ failed: string[]; cdnPurged: boolean | null }> {
  await transaction(db, async (client) => {
    const status = (await client.query('SELECT status FROM pet_match.pets WHERE pet_id = $1 FOR UPDATE', [plan.petId])).rows[0]?.status;
    if (!status || status === 'removed') throw new Error(`pet ${plan.petId} changed since the plan was made`);
    await client.query(
      `UPDATE pet_match.pets
          SET status = 'removed', removed_at = now(), name = NULL, owner_user_id = NULL, family_id = NULL, species = NULL,
              intro = NULL, owner_quote = NULL, sticker_key = NULL, photo_key = NULL, coat = NULL, updated_at = now()
        WHERE pet_id = $1`,
      [plan.petId],
    );
    for (const s of plan.sharedPhoto) await client.query('UPDATE pet_match.pets SET photo_key = NULL, updated_at = now() WHERE pet_id = $1', [s.petId]);
    for (const f of plan.familyDissolves) await client.query('UPDATE pet_match.pets SET family_id = NULL, updated_at = now() WHERE pet_id = $1', [f.petId]);
  });
  // 先提交下架，再清边缘缓存，避免清理后又从仍上架的记录填回缓存。
  let cdnPurged: boolean | null = null;
  if (purgeImages) {
    try {
      await purgeImages(plan.petId);
      cdnPurged = true;
    } catch {
      // 不恢复已下架资料；命令行显式报告，并可独立重试清 CDN。
      cdnPurged = false;
    }
  }
  const failed: string[] = [];
  for (const key of plan.objects) await store.delete(key).catch(() => failed.push(key));
  return { failed, cdnPurged };
}
