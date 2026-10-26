import { afterAll, beforeAll, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';
import { buildApp } from '../src/app.ts';
import { slackDirectory } from '../src/services/slackDirectory.ts';
import { syncSlackMembers } from '../src/services/syncSlackMembers.ts';

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

it('新规则同步停用已入库的外部邮箱和公共账号，搜索与身份选择都不能补回', async () => {
  const excluded = [
    { userId: 'U_OLD_EXTERNAL', name: 'External Person', email: 'external@partner.com' },
    { userId: 'U_OLD_NO_EMAIL', name: 'Missing Email', email: null },
    { userId: 'U_OLD_INFRA', name: 'Platform Infra', email: 'infra@moego.pet' },
    { userId: 'U_OLD_DEVOPS', name: 'MoeGo Devops', email: 'devops@moego.pet' },
    { userId: 'U_OLD_ADMIN', name: 'Shared Admin', email: 'admin_MSlack@moego.pet' },
    { userId: 'U_OLD_TEST_TIM', name: 'Test Tim', email: 'test.tim@moego.pet' },
  ];
  for (const member of excluded) {
    await ctx.pool.query('INSERT INTO pet_match.slack_members (user_id, name, email) VALUES ($1, $2, $3)', [member.userId, member.name, member.email]);
  }
  const members = [
    { userId: 'U_TEST_ALICE', name: 'Alice', email: 'alice@moego.pet' },
    ...excluded,
    { userId: 'U_NEW_SHARED', name: 'New Shared Account', email: 'infra@moego.pet' },
  ];
  const directory = slackDirectory('xoxb-test', {
    allowGuests: true,
    fetchImpl: (async () => ({
      status: 200,
      json: async () => ({ ok: true, members: members.map(m => ({ id: m.userId, team_id: 'T011CF3CMJN', profile: { real_name: m.name, email: m.email } })) }),
    })) as unknown as typeof fetch,
  })!;
  expect(await syncSlackMembers(ctx.pool, await directory.all())).toBe(1);
  const app = buildApp({ pool: ctx.pool, directory });
  try {
    for (const member of [...excluded, members[members.length - 1]]) {
      const search = await app.inject({ method: 'GET', url: `/api/roster?q=${encodeURIComponent(member.name)}` });
      expect(search.json().results).toEqual([]);
      const player = await app.inject({ method: 'GET', url: `/api/players/${member.userId}` });
      expect(player.statusCode).toBe(404);
    }
    expect((await app.inject({ method: 'GET', url: '/api/players/U_TEST_ALICE' })).statusCode).toBe(200);
    const saved = await ctx.pool.query('SELECT user_id, active FROM pet_match.slack_members WHERE user_id = ANY($1::text[]) ORDER BY user_id', [excluded.map(m => m.userId)]);
    expect(saved.rows).toEqual(excluded.map(m => ({ user_id: m.userId, active: false })).sort((a, b) => a.user_id.localeCompare(b.user_id)));
    expect((await ctx.pool.query("SELECT 1 FROM pet_match.slack_members WHERE user_id='U_NEW_SHARED'")).rowCount).toBe(0);
  } finally {
    await app.close();
  }
});
