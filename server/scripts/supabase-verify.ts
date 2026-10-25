/**
 * 用专用角色核验 Supabase：能读同事视图、不能读原人员表、能走完「登记 + 结算」。
 * 冒烟在一个事务里进行并最终 ROLLBACK，不留下任何数据。
 */
import pg from 'pg';
import { readSupabaseAdminConfig } from '../src/db/adminUrl.ts';
import type { Pool } from '../src/db/pool.ts';
import { registerGame, settleGame } from '../src/services/games.ts';
import { RULES } from '../../web/src/engine/config.ts';

const appUrl = process.env.PET_MATCH_DATABASE_URL;
if (!appUrl) throw new Error('PET_MATCH_DATABASE_URL missing');
const SMOKE_PLAYER = 'U03FPQWGTN2';

const app = new pg.Client({ connectionString: appUrl, ssl: { rejectUnauthorized: false } });
await app.connect();
try {
  console.log('connected as:', (await app.query('SELECT current_user')).rows[0].current_user);
  console.log('colleagues visible:', (await app.query('SELECT count(*)::int AS n FROM pet_match.colleagues')).rows[0].n);
  try {
    await app.query('SELECT 1 FROM public."user" LIMIT 1');
    console.log('public."user" direct read: ALLOWED (unexpected)');
  } catch (e) {
    console.log('public."user" direct read: denied ->', (e as Error).message);
  }
  try {
    await app.query(`INSERT INTO pet_match.pets (pet_id, name, status) VALUES ('x', 'x', 'published')`);
    console.log('pets write: ALLOWED (unexpected)');
  } catch (e) {
    console.log('pets write: denied ->', (e as Error).message);
  }
} finally {
  await app.end();
}

// 冒烟：管理员连接开事务插入临时宠物，切换到专用角色跑真实服务代码，最后整体回滚
const admin = new pg.Client(readSupabaseAdminConfig());
await admin.connect();
try {
  await admin.query('BEGIN');
  for (let i = 0; i < 6; i++) {
    await admin.query(`INSERT INTO pet_match.pets (pet_id, name, status) VALUES ($1, $1, 'published')`, [`smoke_${i}`]);
  }
  // 成员关系授权也在本事务内，随最终 ROLLBACK 一起撤销
  await admin.query('GRANT pet_match_app TO current_user');
  await admin.query('SET LOCAL ROLE pet_match_app');
  let sp = 0;
  const tx = {
    query: (sql: string, params?: unknown[]) => admin.query(sql, params),
    connect: async () => ({
      query: (sql: string, params?: unknown[]) => {
        if (sql === 'BEGIN') return admin.query(`SAVEPOINT s${++sp}`);
        if (sql === 'COMMIT') return admin.query(`RELEASE SAVEPOINT s${sp}`);
        if (sql === 'ROLLBACK') return admin.query(`ROLLBACK TO SAVEPOINT s${sp}`);
        return admin.query(sql, params);
      },
      release: () => {},
    }),
  } as unknown as Pool;
  const game = await registerGame(tx, SMOKE_PLAYER, 'normal');
  const pets = game.lineup.map((p, i) => ({ id: p.petId, served: i === 0 ? 3 : 0, firstServedSeq: i === 0 ? 1 : null }));
  const res = await settleGame(tx, game.gameId, SMOKE_PLAYER, {
    rulesVersion: game.rulesVersion,
    completed: true,
    score: 3 * RULES.baseScore,
    clearedCells: 3,
    clearedByMultiplier: [3, 0, 0, 0, 0],
    rushSucceeded: false,
    maxChain: 1,
    toolsFired: 0,
    validMoves: 1,
    actedInLastSeconds: false,
    pets,
  });
  console.log('smoke settle:', JSON.stringify({ score: res.score, isNew: res.personalBest.isNew, newCollected: res.newCollected.length, progress: res.progress }));
} finally {
  await admin.query('ROLLBACK');
  const member = await admin.query(
    `SELECT count(*)::int AS n FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.roleid WHERE r.rolname = 'pet_match_app'`,
  );
  console.log('pet_match_app memberships after rollback:', member.rows[0].n);
  const left = await admin.query(
    `SELECT (SELECT count(*) FROM pet_match.games)::int AS games, (SELECT count(*) FROM pet_match.pets)::int AS pets, (SELECT count(*) FROM pet_match.game_results)::int AS results`,
  );
  console.log('after rollback:', JSON.stringify(left.rows[0]));
  await admin.end();
}
