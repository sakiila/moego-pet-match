import type pg from 'pg';
import type { AchievementView } from '../../../web/src/api/types.ts';
import { ACHIEVEMENTS, HIDDEN_ACHIEVEMENT_IDS, servedHotpot, type AchievementId, type AchievementMetric } from '../../../web/src/game/achievementRules.ts';

/** 所有授予与佩戴操作按玩家串行，避免两个不同对局或补发请求同时越过同一门槛。 */
export async function lockAchievements(client: pg.PoolClient, playerId: string) {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended('achievements:' || $1, 0))", [playerId]);
}

async function metrics(client: pg.PoolClient, playerId: string): Promise<Record<AchievementMetric | 'total', number>> {
  const { rows } = await client.query(`
    WITH catalog AS (
      SELECT p.owner_user_id, p.family_id, c.pet_id IS NOT NULL AS collected,
        CASE lower(btrim(regexp_replace(coalesce(p.species,''), '[（(].*$', '')))
          WHEN '猫' THEN 'cat' WHEN 'cats' THEN 'cat'
          WHEN '狗' THEN 'dog' WHEN 'dogs' THEN 'dog'
          WHEN '鹦鹉' THEN 'bird' WHEN '鸟' THEN 'bird' WHEN 'parrot' THEN 'bird' WHEN 'birds' THEN 'bird'
          WHEN '兔' THEN 'rabbit' WHEN '兔子' THEN 'rabbit' WHEN 'bunny' THEN 'rabbit'
          WHEN '' THEN NULL WHEN 'unknown' THEN NULL WHEN '未知' THEN NULL WHEN '其他' THEN NULL
          ELSE lower(btrim(regexp_replace(p.species, '[（(].*$', ''))) END AS species
      FROM pet_match.pets p LEFT JOIN pet_match.collections c ON c.pet_id=p.pet_id AND c.player_id=$1
      WHERE p.status='published'
    ) SELECT count(*) AS total, count(*) FILTER(WHERE collected) AS collected,
      count(*) FILTER(WHERE collected AND species='cat') AS cats,
      count(*) FILTER(WHERE collected AND species='dog') AS dogs,
      count(DISTINCT species) FILTER(WHERE collected) AS species,
      count(DISTINCT owner_user_id) FILTER(WHERE collected) AS owners,
      (SELECT count(*) FROM (SELECT family_id FROM catalog WHERE family_id IS NOT NULL
        GROUP BY family_id HAVING count(*) >= 2 AND bool_and(collected)) f) AS families
    FROM catalog`, [playerId]);
  return Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [key, Number(value)])) as Record<AchievementMetric | 'total', number>;
}

/**
 * 在调用方事务中授予。sourceGameId 为空表示老玩家补发，不作为某局新解锁展示。
 * servedPetIds 为本局实际服务到的上架宠物（只在结算时传入）：隐藏称号「火锅搭子」按单局判定，补发与回访不会授予。
 */
export async function syncAchievements(client: pg.PoolClient, playerId: string, sourceGameId: string | null = null, servedPetIds: readonly string[] = []): Promise<AchievementId[]> {
  await lockAchievements(client, playerId);
  const values = await metrics(client, playerId);
  const unlocked: AchievementId[] = [];
  const award = async (id: AchievementId, target: number) => {
    const result = await client.query(`INSERT INTO pet_match.achievement_awards(player_id,achievement_id,target_value,source_game_id)
      VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING achievement_id`, [playerId, id, target, sourceGameId]);
    if (result.rowCount) unlocked.push(id);
  };
  for (const rule of ACHIEVEMENTS) {
    const target = rule.target === 'catalog' ? values.total : rule.target;
    if (target <= 0 || values[rule.metric] < target) continue;
    await award(rule.id, target);
  }
  if (sourceGameId && servedHotpot(servedPetIds)) await award('hotpot', 1);
  return unlocked;
}

/**
 * 返回汇总进度，不返回未认识的宠物及主人关系。已获得的徽章保留当时目标与完成状态。
 * 隐藏成就解锁前不出现在列表里（也不计入总数），解锁后以已完成状态排在最后。
 */
export async function readAchievements(client: pg.PoolClient, playerId: string): Promise<AchievementView> {
  await syncAchievements(client, playerId);
  const values = await metrics(client, playerId);
  const awards = await client.query('SELECT achievement_id,target_value,unlocked_at FROM pet_match.achievement_awards WHERE player_id=$1', [playerId]);
  const title = await client.query('SELECT equipped_title FROM pet_match.player_titles WHERE player_id=$1', [playerId]);
  const at = (award: { unlocked_at: Date }) => new Date(award.unlocked_at).toISOString();
  const hidden = HIDDEN_ACHIEVEMENT_IDS.flatMap(id => {
    const award = awards.rows.find(a => a.achievement_id === id);
    return award ? [{ id, current: award.target_value, target: award.target_value, unlockedAt: at(award) }] : [];
  });
  return {
    achievements: [
      ...ACHIEVEMENTS.map(rule => {
        const award = awards.rows.find(a => a.achievement_id === rule.id);
        const target = award?.target_value ?? (rule.target === 'catalog' ? values.total : rule.target);
        return { id:rule.id, current:award ? target : Math.min(values[rule.metric],target), target, unlockedAt:award ? at(award) : null };
      }),
      ...hidden,
    ],
    equippedTitle: title.rows[0]?.equipped_title ?? null,
  };
}
