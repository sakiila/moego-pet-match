import type { CollectionView, DailyManager, PetDetail } from '../../../web/src/api/types.ts';
import { inTransaction, type Pool } from '../db/pool.ts';

/** 图鉴目录：全部上架普通宠物 + 本人收集状态；未收集只给名字，主人仅对已收集或自家宠物返回。 */
export async function listCollection(pool: Pool, playerId: string): Promise<CollectionView> {
  const { rows } = await pool.query(
    `SELECT p.pet_id, p.name, p.owner_user_id, c.name AS owner_name, col.collected_at
     FROM pet_match.pets p
     LEFT JOIN pet_match.colleagues c ON c.user_id = p.owner_user_id
     LEFT JOIN pet_match.collections col ON col.pet_id = p.pet_id AND col.player_id = $1
     WHERE p.status = 'published'
     ORDER BY p.name`,
    [playerId],
  );
  const pets = rows.map((r) => {
    const collected = r.collected_at != null;
    const own = r.owner_user_id === playerId;
    return {
      petId: r.pet_id,
      name: r.name,
      collected,
      collectedAt: collected ? new Date(r.collected_at).toISOString() : null,
      owner: (collected || own) && r.owner_user_id && r.owner_name ? { userId: r.owner_user_id, name: r.owner_name } : null,
      own,
    };
  });
  return { total: pets.length, collected: pets.filter((p) => p.collected).length, pets };
}

export async function petDetail(pool: Pool, petId: string, playerId: string): Promise<PetDetail | null> {
  const { rows } = await pool.query(
    `SELECT p.pet_id, p.name, p.status, p.owner_user_id, p.intro, p.owner_quote, p.photo_key, c.name AS owner_name,
            EXISTS (SELECT 1 FROM pet_match.collections col WHERE col.pet_id = p.pet_id AND col.player_id = $2) AS collected
     FROM pet_match.pets p LEFT JOIN pet_match.colleagues c ON c.user_id = p.owner_user_id
     WHERE p.pet_id = $1`,
    [petId, playerId],
  );
  const r = rows[0];
  if (!r) return null;
  const listed = r.status === 'published';
  const own = r.owner_user_id === playerId;
  const visible = listed && (r.collected || own);
  return {
    petId: r.pet_id,
    name: r.name,
    collected: r.collected,
    own,
    owner: visible && r.owner_name ? { userId: r.owner_user_id, name: r.owner_name } : null,
    quote: visible ? (r.owner_quote ?? r.intro ?? null) : null,
    hasPhoto: visible && !!r.photo_key,
    listed,
  };
}

/** 北京时间（UTC+8，无夏令时）的自然日。 */
export function beijingDate(now = new Date()): string {
  return new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
}

/**
 * 每日店长：同一北京自然日全员同一只。首次请求当日时选出并记录：优先从未当过店长的上架宠物中随机，
 * 都当过则选最久之前当过的；当日店长若已下架则改选。个人权重与排行不影响。
 */
export async function dailyManager(pool: Pool, now = new Date(), random = Math.random): Promise<DailyManager | null> {
  const date = beijingDate(now);
  return inTransaction(pool, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`daily_manager:${date}`]);
    const today = (
      await client.query(
        `SELECT d.pet_id, p.name, p.status FROM pet_match.daily_managers d JOIN pet_match.pets p USING (pet_id) WHERE d.manager_date = $1`,
        [date],
      )
    ).rows[0];
    if (today?.status === 'published') return { date, pet: { petId: today.pet_id, name: today.name } };

    const candidates = (
      await client.query(
        `SELECT p.pet_id, p.name, max(d.manager_date) AS last_date
         FROM pet_match.pets p LEFT JOIN pet_match.daily_managers d ON d.pet_id = p.pet_id AND d.manager_date < $1
         WHERE p.status = 'published' AND p.sticker_key IS NOT NULL
         GROUP BY p.pet_id, p.name`,
        [date],
      )
    ).rows;
    if (!candidates.length) return null;
    const fresh = candidates.filter((c) => c.last_date == null);
    const pool2 = fresh.length ? fresh : candidates.filter((c) => +c.last_date === Math.min(...candidates.map((x) => +x.last_date)));
    const pick = pool2[Math.floor(random() * pool2.length)];
    await client.query(
      `INSERT INTO pet_match.daily_managers (manager_date, pet_id) VALUES ($1, $2)
       ON CONFLICT (manager_date) DO UPDATE SET pet_id = EXCLUDED.pet_id, chosen_at = now()`,
      [date, pick.pet_id],
    );
    return { date, pet: { petId: pick.pet_id, name: pick.name } };
  });
}
