import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => {
  ctx = await freshDatabase();
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});

const get = (url: string) => ctx.app.inject({ method: 'GET', url });

describe('同事名单', () => {
  it('视图只包含有效同事：排除停用、机器人与外部访客', async () => {
    const { rows } = await ctx.pool.query('SELECT user_id FROM pet_match.colleagues ORDER BY user_id');
    expect(rows.map((r) => r.user_id)).toEqual(['U_TEST_ALICE', 'U_TEST_BOB', 'U_TEST_LONG', 'U_TEST_SAM', 'U_TEST_ZHANG']);
  });

  it('按名字包含与邮箱前缀搜索，只返回 userId 与名字', async () => {
    const byName = (await get('/api/roster?q=chen')).json();
    expect(byName.results).toEqual([{ userId: 'U_TEST_ALICE', name: 'Alice Chen' }]);
    expect((await get('/api/roster?q=张伟')).json().results).toEqual([{ userId: 'U_TEST_ZHANG', name: 'Zhang Wei(张伟)' }]);
    expect((await get('/api/roster?q=zhangw')).json().results.map((r: { userId: string }) => r.userId)).toEqual(['U_TEST_ZHANG']);
  });

  it('被过滤的人搜不到；空关键词返回空；通配符按字面处理', async () => {
    expect((await get('/api/roster?q=bot')).json().results).toEqual([]);
    expect((await get('/api/roster?q=guest')).json().results).toEqual([]);
    expect((await get('/api/roster?q=')).json().results).toEqual([]);
    expect((await get('/api/roster?q=%25')).json().results).toEqual([]);
  });
});

describe('玩家身份校验', () => {
  it('有效身份返回资料与空记录', async () => {
    const res = await get('/api/players/U_TEST_BOB');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      userId: 'U_TEST_BOB',
      name: 'Bob',
      best: { normal: null, fish: null },
      progress: { completedNormalGames: 0, fishUnlocked: false },
    });
  });

  it('不在名单（含已停用）返回 404', async () => {
    expect((await get('/api/players/U_TEST_GONE')).statusCode).toBe(404);
    expect((await get('/api/players/U_NOBODY')).statusCode).toBe(404);
  });

  it('数据库不可用时返回 503，与未找到区分', async () => {
    const { buildApp } = await import('../src/app.ts');
    const { createPool } = await import('../src/db/pool.ts');
    const broken = createPool('postgres://postgres:wrong@localhost:54329/pet_match_test');
    const app = buildApp({ pool: broken });
    const res = await app.inject({ method: 'GET', url: '/api/roster?q=bob' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ error: 'unavailable' });
    await app.close();
    await broken.end();
  });
});
