/**
 * 在 Supabase 建立 pet_match：schema、迁移、专用角色与授权。
 * 默认只打印将执行的 SQL；加 --apply 才执行。密码随机生成，写入 .env 的 PET_MATCH_DATABASE_URL，不回显。
 * 不修改 public."user" 的结构、数据或权限。
 */
import { randomBytes } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { readSupabaseAdminConfig } from '../src/db/adminUrl.ts';
import { listMigrations, migrate } from '../src/db/migrate.ts';

const APPLY = process.argv.includes('--apply');
const ROLE = 'pet_match_app';
const RW_TABLES = ['games', 'game_results', 'best_scores', 'collections', 'player_progress', 'submissions', 'quizzes'];
const RO_EXTRA = ['fish_colors'];
const RO_OBJECTS = ['colleagues', 'pets', ...RO_EXTRA];

const grants = [
  `GRANT USAGE ON SCHEMA pet_match TO ${ROLE}`,
  `GRANT SELECT ON ${RO_OBJECTS.map((t) => `pet_match.${t}`).join(', ')} TO ${ROLE}`,
  `GRANT SELECT, INSERT, UPDATE ON ${RW_TABLES.map((t) => `pet_match.${t}`).join(', ')} TO ${ROLE}`,
];

const admin = readSupabaseAdminConfig();
const client = new pg.Client(admin);
await client.connect();
try {
  const roleExists = (await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [ROLE])).rowCount === 1;
  const done = new Set(
    (await client.query(`SELECT to_regclass('pet_match.schema_migrations') IS NOT NULL AS ok`)).rows[0].ok
      ? (await client.query('SELECT version FROM pet_match.schema_migrations')).rows.map((r) => r.version)
      : [],
  );
  const pending = listMigrations().filter((m) => !done.has(m.version)).map((m) => m.version);

  console.log('Plan:');
  console.log('  CREATE SCHEMA IF NOT EXISTS pet_match');
  console.log(`  migrations to apply: ${pending.length ? pending.join(', ') : '(none)'}`);
  console.log(roleExists ? `  role ${ROLE}: exists (password unchanged)` : `  CREATE ROLE ${ROLE} LOGIN PASSWORD '<random>' NOINHERIT`);
  grants.forEach((g) => console.log(`  ${g}`));
  console.log('  public."user": untouched (no grant to the app role)');
  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to execute.');
  } else {
    await migrate(client);
    if (!roleExists) {
      const password = randomBytes(24).toString('base64url');
      await client.query(`CREATE ROLE ${ROLE} LOGIN NOINHERIT PASSWORD '${password}'`);
      const ref = admin.user.split('.')[1];
      const url = `postgres://${ROLE}.${ref}:${password}@${admin.host}:${admin.port}/${admin.database}`;
      const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
      const env = readFileSync(envPath, 'utf8');
      if (env.includes('PET_MATCH_DATABASE_URL=')) throw new Error('PET_MATCH_DATABASE_URL already in .env; refusing to overwrite');
      appendFileSync(envPath, `${env.endsWith('\n') ? '' : '\n'}\n# 游戏服务专用数据库角色（scripts/supabase-setup.ts 生成）\nPET_MATCH_DATABASE_URL=${url}\n`);
      console.log(`\nCreated ${ROLE}; connection string written to .env as PET_MATCH_DATABASE_URL.`);
    }
    for (const g of grants) await client.query(g);
    console.log('Applied.');
  }
} finally {
  await client.end();
}
