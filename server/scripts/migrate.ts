/** 本地：建模拟人员表 → 迁移 → 种占位宠物。只允许本地库；Supabase 用 supabase-setup.ts。 */
import pg from 'pg';
import { config, isLocalDatabase } from '../src/config.ts';
import { migrate } from '../src/db/migrate.ts';
import { seedLocal, seedPlaceholderPets } from '../src/db/localSeed.ts';

if (!isLocalDatabase(config.databaseUrl)) throw new Error('migrate.ts only runs against a local database');
const client = new pg.Client({ connectionString: config.databaseUrl });
await client.connect();
try {
  await seedLocal(client);
  // 开发库额外加入一位真实宠物主人（Bob），用于验证自家宠物优先；测试库不使用
  await client.query(
    `INSERT INTO public."user" (user_id, email, real_name_normalized, team_id) VALUES ('U03FPQWGTN2', 'bob.real@moego.pet', 'Bob 包博', 'T011CF3CMJN')`,
  );
  const applied = await migrate(client);
  await seedPlaceholderPets(client);
  console.log(applied.length ? `applied: ${applied.join(', ')}` : 'up to date');
} finally {
  await client.end();
}
