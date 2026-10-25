import { afterAll, beforeAll, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => { ctx = await freshDatabase(); });
afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });

it('移除原人员表后，身份搜索与玩家读取仍可用', async () => {
  await ctx.pool.query('DROP TABLE public."user"');
  const search = await ctx.app.inject({ method: 'GET', url: '/api/roster?q=alice' });
  expect(search.statusCode).toBe(200);
  expect(search.json().results).toEqual([{ userId: 'U_TEST_ALICE', name: 'Alice Chen' }]);
  const player = await ctx.app.inject({ method: 'GET', url: '/api/players/U_TEST_BOB' });
  expect(player.statusCode).toBe(200);
  expect(player.json().userId).toBe('U_TEST_BOB');
});

it('完整 Slack 同步更新名字、停用缺席账号，空目录不清空现有名单', async () => {
  const { syncSlackMembers } = await import('../src/services/syncSlackMembers.ts');
  const members = [
    { userId: 'U_TEST_ALICE', name: 'Alice Updated', email: 'alice@moego.pet' },
    { userId: 'U_SLACK_JOINED', name: 'New Teammate', email: null },
  ];
  await syncSlackMembers(ctx.pool, members);
  expect((await ctx.pool.query('SELECT user_id, name FROM pet_match.colleagues ORDER BY user_id')).rows).toEqual([
    { user_id: 'U_SLACK_JOINED', name: 'New Teammate' },
    { user_id: 'U_TEST_ALICE', name: 'Alice Updated' },
  ]);
  expect((await ctx.pool.query("SELECT active FROM pet_match.slack_members WHERE user_id='U_TEST_BOB'")).rows[0].active).toBe(false);
  await expect(syncSlackMembers(ctx.pool, [])).rejects.toThrow('empty');
  expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.colleagues')).rows[0].n).toBe(2);
});

it('同步写入失败时不留下停用一半的名册', async () => {
  const { syncSlackMembers } = await import('../src/services/syncSlackMembers.ts');
  const before = (await ctx.pool.query('SELECT * FROM pet_match.slack_members ORDER BY user_id')).rows;
  await expect(syncSlackMembers(ctx.pool, [
    { userId: 'U_DUP', name: 'One', email: null },
    { userId: 'U_DUP', name: 'Two', email: null },
  ])).rejects.toThrow();
  expect((await ctx.pool.query('SELECT * FROM pet_match.slack_members ORDER BY user_id')).rows).toEqual(before);
});
