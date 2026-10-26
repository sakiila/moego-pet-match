import pg from 'pg';
import { buildApp, type AppDeps } from '../src/app.ts';
import type { InjectOptions } from 'fastify';
import { createSession } from '../src/services/auth.ts';
import { LOCAL_TEST_URL } from '../src/config.ts';
import { seedLocal, seedLocalMembers, seedPlaceholderPets, seedTestFishColors } from '../src/db/localSeed.ts';
import { migrate } from '../src/db/migrate.ts';
import { createPool } from '../src/db/pool.ts';

process.env.NODE_ENV = 'test';

/** 既有业务用例以请求指定的玩家登录；使用真实数据库会话，不关闭生产鉴权。
 * 鉴权用例必须使用原始 buildApp，显式执行设置密码和登录。
 */
export function buildAuthenticatedApp(deps: AppDeps) {
  const app = buildApp(deps);
  const inject = app.inject.bind(app);
  const sessions = new Map<string, Promise<string>>();
  app.inject = (async (options: InjectOptions | string) => {
    const opts = typeof options === 'string' ? { url: options } : options;
    if (opts.headers?.cookie) return inject(opts);
    const url = new URL(typeof opts.url === 'string' ? opts.url : opts.url?.pathname ?? '/', 'http://localhost');
    if (!/^\/api\/(?:players|pets|games|quizzes|my-pets|deletion-requests|submissions)(?:\/|$)/.test(url.pathname) && !url.pathname.startsWith('/img/photos/')) return inject(opts);
    const payload = opts.payload;
    const body = typeof payload === 'object' && !Buffer.isBuffer(payload) ? payload as { playerId?: string } : undefined;
    const multipartId = Buffer.isBuffer(payload) ? /name="playerId"\r\n\r\n([^\r\n]+)/.exec(payload.toString())?.[1] : undefined;
    const privateId = /^\/api\/players\/([^/]+)(?:\/(?:title|achievements))?$/.exec(url.pathname)?.[1];
    const id = typeof body?.playerId === 'string' && body.playerId || multipartId || url.searchParams.get('playerId') || url.searchParams.get('viewerId') || privateId || 'U_TEST_BOB';
    if (!sessions.has(id)) sessions.set(id, createSession(deps.pool, id));
    const token = await sessions.get(id)!;
    return inject({ ...opts, headers: { ...opts.headers, cookie: `pet_match_session=${token}` } });
  }) as typeof app.inject;
  return app;
}

/** 每个测试文件从空库开始：删除 pet_match 与模拟人员表，重新种子与迁移。 */
export async function freshDatabase(authenticated = true) {
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
  const app = authenticated ? buildAuthenticatedApp({ pool }) : buildApp({ pool });
  return { pool, app };
}
