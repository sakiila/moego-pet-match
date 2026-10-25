import pg from 'pg';
import { buildApp } from '../src/app.ts';
import { LOCAL_TEST_URL } from '../src/config.ts';
import { seedLocal, seedLocalMembers, seedPlaceholderPets, seedTestFishColors } from '../src/db/localSeed.ts';
import { migrate } from '../src/db/migrate.ts';
import { createPool } from '../src/db/pool.ts';

process.env.NODE_ENV = 'test';

/** 每个测试文件从空库开始：删除 pet_match 与模拟人员表，重新种子与迁移。 */
export async function freshDatabase() {
  const admin = new pg.Client({ connectionString: LOCAL_TEST_URL });
  await admin.connect();
  try {
    await admin.query('DROP SCHEMA IF EXISTS pet_match CASCADE');
    await admin.query('DROP TABLE IF EXISTS public."user"');
    await seedLocal(admin);
    await migrate(admin);
    await seedLocalMembers(admin);
    await seedPlaceholderPets(admin);
    await seedTestFishColors(admin);
  } finally {
    await admin.end();
  }
  const pool = createPool(LOCAL_TEST_URL);
  const app = buildApp({ pool });
  return { pool, app };
}
