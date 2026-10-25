/** 本地：建模拟人员表 → 迁移 → 种占位宠物。只允许本地库；Supabase 用 supabase-setup.ts。 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config, isLocalDatabase } from '../src/config.ts';
import { migrate } from '../src/db/migrate.ts';
import { seedLocal, seedLocalMembers, seedPlaceholderPets } from '../src/db/localSeed.ts';

if (!isLocalDatabase(config.databaseUrl)) throw new Error('migrate.ts only runs against a local database');
const client = new pg.Client({ connectionString: config.databaseUrl });
await client.connect();
try {
  await seedLocal(client);
  // 开发库额外加入已确认的真实宠物主人（只含 user_id 与名字），用于验证自家宠物优先、猜主人与团聚；测试库不使用
  const mapPath = fileURLToPath(new URL('../../data/pet-materials/owner-slack-map.json', import.meta.url));
  if (existsSync(mapPath)) {
    const map = JSON.parse(readFileSync(mapPath, 'utf8'));
    for (const o of map.owners.filter((x: { slack_user_id: string | null }) => x.slack_user_id)) {
      await client.query(
        `INSERT INTO public."user" (user_id, email, real_name_normalized, team_id) VALUES ($1, $2, $3, 'T011CF3CMJN')`,
        [o.slack_user_id, `${o.slack_user_id.toLowerCase()}@moego.pet`, o.matched_name],
      );
    }
  }
  const applied = await migrate(client);
  await seedLocalMembers(client);
  if (existsSync(mapPath)) {
    const map = JSON.parse(readFileSync(mapPath, 'utf8'));
    for (const o of map.owners.filter((x: { slack_user_id: string | null }) => x.slack_user_id)) {
      await client.query(
        `INSERT INTO pet_match.slack_members (user_id, name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
        [o.slack_user_id, o.matched_name],
      );
    }
  }
  await seedPlaceholderPets(client);
  console.log(applied.length ? `applied: ${applied.join(', ')}` : 'up to date');
} finally {
  await client.end();
}
