import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildAuthenticatedApp as buildApp } from './helpers.ts';
import { slackDirectory, toMember, type SlackDirectory } from '../src/services/slackDirectory.ts';
import { freshDatabase } from './helpers.ts';

const raw = (over: Record<string, unknown>) => ({ id: 'U1', team_id: 'T011CF3CMJN', profile: { real_name_normalized: 'New Hire', email: 'new@moego.pet' }, ...over });

describe('Slack 目录过滤', () => {
  it('公司邮箱的在职同事通过；停用、机器人、访客、Slackbot 被排除', () => {
    expect(toMember(raw({}))).toEqual({ userId: 'U1', name: 'New Hire', email: 'new@moego.pet' });
    expect(toMember(raw({ deleted: true }))).toBeNull();
    expect(toMember(raw({ is_bot: true }))).toBeNull();
    expect(toMember(raw({ is_restricted: true }))).toBeNull();
    expect(toMember(raw({ is_ultra_restricted: true }))).toBeNull();
    expect(toMember(raw({ id: 'USLACKBOT' }))).toBeNull();
    expect(toMember(raw({ team_id: 'T_OTHER', profile: { real_name_normalized: 'X', email: 'x@partner.com' } }))).toBeNull();
    expect(toMember(raw({ team_id: 'T_OTHER', profile: { real_name_normalized: 'Y', email: 'y@moego.pet' } }))?.userId).toBe('U1');
  });

  it.each([undefined, null, '', 'person@partner.com', 'person@othermoego.pet', 'person@moego.pet.example.com', 'person@sub.moego.pet'])(
    '即使属于 MoeGo 工作区或允许访客，邮箱 %s 也不能通过', (email) => {
      const user = raw({ is_restricted: true, profile: { real_name: 'External', email } });
      expect(toMember(user, true)).toBeNull();
    },
  );

  it.each(['infra@moego.pet', 'devops@moego.pet', 'admin_MSlack@moego.pet', 'test.tim@moego.pet', ' INFRA@MOEGO.PET '])(
    '排除未标记为机器人的公共账号 %s', (email) => {
      expect(toMember(raw({ profile: { real_name: 'Shared Account', email } }), true)).toBeNull();
    },
  );

  it('邮箱忽略大小写和首尾空格；不按职位或邮箱前缀误伤真人', () => {
    expect(toMember(raw({ profile: { real_name: 'Engineer', email: ' Person@MOEGO.PET ' } }))?.email).toBe('Person@MOEGO.PET');
    expect(toMember(raw({ profile: { real_name: 'Infra Engineer', email: 'infra.engineer@moego.pet' } }))?.userId).toBe('U1');
    expect(toMember(raw({ profile: { real_name: 'Salesforce Administrator', email: 'admin.person@moego.pet' } }))?.userId).toBe('U1');
  });
});

describe('Slack 目录缓存', () => {
  const page = (members: unknown[], next = '') => ({ json: async () => ({ ok: true, members, response_metadata: { next_cursor: next } }), status: 200 });

  it('完整同步、搜索与按 ID 查询共用过滤；允许访客仍须公司邮箱', async () => {
    const dir = slackDirectory('xoxb-test', {
      allowGuests: true,
      fetchImpl: (async () => page([
        raw({ id: 'GUEST', is_restricted: true, is_ultra_restricted: true }),
        raw({ id: 'GONE', deleted: true }),
        raw({ id: 'OUTSIDE', team_id: 'T_OTHER', profile: { real_name_normalized: 'Outside', email: 'a@partner.com' } }),
        raw({ id: 'WORKSPACE_EXTERNAL', profile: { real_name: 'External', email: 'external@partner.com' } }),
        raw({ id: 'SHARED', profile: { real_name: 'Infra', email: 'infra@moego.pet' } }),
      ])) as unknown as typeof fetch,
    })!;
    expect((await dir.all()).map(m => m.userId)).toEqual(['GUEST']);
    expect((await dir.search('new')).map(m => m.userId)).toEqual(['GUEST']);
    expect(await dir.search('infra')).toEqual([]);
    expect(await dir.get('SHARED')).toBeNull();
    expect(await dir.get('WORKSPACE_EXTERNAL')).toBeNull();
  });

  it('分页读取、缓存期内不重复请求、过期后刷新、刷新失败沿用旧缓存', async () => {
    let t = 0;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(page([raw({ id: 'U1' })], 'c2'))
      .mockResolvedValueOnce(page([raw({ id: 'U2', profile: { real_name_normalized: 'Second', email: 'second@moego.pet' } })]))
      .mockRejectedValueOnce(new Error('network'));
    const dir = slackDirectory('xoxb-test', { ttlMs: 1000, fetchImpl: fetchImpl as unknown as typeof fetch, now: () => t })!;
    expect((await dir.search('new')).map((m) => m.userId)).toEqual(['U1']);
    expect((await dir.search('secon')).map((m) => m.userId)).toEqual(['U2']);
    expect((await dir.search('second@')).length).toBe(0);
    expect((await dir.get('U2'))?.name).toBe('Second');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    t = 5000;
    expect((await dir.get('U1'))?.name).toBe('New Hire');
  });

  it('提供完整有效名单；分页超过上限时拒绝返回不完整名单', async () => {
    const complete = slackDirectory('xoxb-test', { fetchImpl: (async () => page([raw({}), raw({ id: 'BOT', is_bot: true })])) as unknown as typeof fetch })!;
    expect((await complete.all()).map(m => m.userId)).toEqual(['U1']);
    const incomplete = slackDirectory('xoxb-test', { fetchImpl: (async () => page([raw({})], 'more')) as unknown as typeof fetch })!;
    await expect(incomplete.all()).rejects.toThrow('pagination incomplete');
  });

  it('定时完整同步绕过搜索缓存；失败和缺页保留搜索缓存但不作为完整同步成功', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(page([raw({})]))
      .mockResolvedValueOnce(page([raw({ id: 'U2' })]))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ status: 200, json: async () => ({ ok: true }) });
    const dir = slackDirectory('xoxb-test', { fetchImpl: fetchImpl as unknown as typeof fetch })!;
    expect((await dir.search('new')).map(m => m.userId)).toEqual(['U1']);
    expect((await dir.all()).map(m => m.userId)).toEqual(['U2']);
    await expect(dir.all()).rejects.toThrow('offline');
    expect((await dir.search('new')).map(m => m.userId)).toEqual(['U2']);
    await expect(dir.all()).rejects.toThrow('missing members');
    expect((await dir.search('new')).map(m => m.userId)).toEqual(['U2']);
  });

  it('未配置令牌时没有目录；没有缓存时失败向上抛', async () => {
    expect(slackDirectory(undefined)).toBeNull();
    const dir = slackDirectory('xoxb-test', { fetchImpl: (async () => ({ json: async () => ({ ok: false, error: 'invalid_auth' }), status: 200 })) as unknown as typeof fetch })!;
    await expect(dir.search('a')).rejects.toThrow('invalid_auth');
  });
});

describe('名单外同事：搜索与登记', () => {
  let ctx: Awaited<ReturnType<typeof freshDatabase>>;
  let app: ReturnType<typeof buildApp>;
  let failing = false;
  const people = [
    { userId: 'U_SLACK_NEW', name: 'Nora Newcomer', email: 'nora@moego.pet' },
    { userId: 'U_TEST_ALICE', name: 'Alice Chen', email: 'alice@moego.pet' },
    { userId: 'U_TEST_GONE', name: 'Departed Person', email: 'gone@moego.pet' },
  ];
  const directory: SlackDirectory = {
    async search(q) {
      if (failing) throw new Error('slack down');
      return people.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    },
    async get(id) {
      if (failing) throw new Error('slack down');
      return people.find((p) => p.userId === id) ?? null;
    },
  };
  beforeAll(async () => {
    ctx = await freshDatabase();
    app = buildApp({ pool: ctx.pool, directory });
  });
  afterAll(async () => {
    await app.close();
    await ctx.app.close();
    await ctx.pool.end();
  });
  const get = (url: string) => app.inject({ method: 'GET', url });

  it('搜索合并 Slack 结果；已在名单的不重复，被人员表停用的人不补回', async () => {
    expect((await get('/api/roster?q=nora')).json().results).toEqual([{ userId: 'U_SLACK_NEW', name: 'Nora Newcomer' }]);
    expect((await get('/api/roster?q=alice')).json().results).toEqual([{ userId: 'U_TEST_ALICE', name: 'Alice Chen' }]);
    expect((await get('/api/roster?q=departed')).json().results).toEqual([]);
  });

  it('只搜索不登记；选中后登记并进入名单，之后全站都认得', async () => {
    expect((await ctx.pool.query('SELECT 1 FROM pet_match.colleagues WHERE user_id = $1', ['U_SLACK_NEW'])).rowCount).toBe(0);
    const res = await get('/api/players/U_SLACK_NEW');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ userId: 'U_SLACK_NEW', name: 'Nora Newcomer', best: { normal: null, fish: null } });
    expect((await ctx.pool.query('SELECT name FROM pet_match.colleagues WHERE user_id = $1', ['U_SLACK_NEW'])).rows).toEqual([{ name: 'Nora Newcomer' }]);
    // 登记后即使 Slack 不可用，回访仍有效；搜索不重复出现
    failing = true;
    expect((await get('/api/players/U_SLACK_NEW')).statusCode).toBe(200);
    expect((await get('/api/roster?q=nora')).json().results).toEqual([{ userId: 'U_SLACK_NEW', name: 'Nora Newcomer' }]);
    failing = false;
  });

  it('不在 Slack 或被人员表停用的 ID 返回 404；Slack 故障时搜索降级、选择返回 503', async () => {
    expect((await get('/api/players/U_NOBODY')).statusCode).toBe(404);
    expect((await get('/api/players/U_TEST_GONE')).statusCode).toBe(404);
    failing = true;
    expect((await get('/api/roster?q=bob')).json().results.map((r: { userId: string }) => r.userId)).toEqual(['U_TEST_BOB']);
    expect((await get('/api/players/U_OTHER_NEW')).statusCode).toBe(503);
    failing = false;
  });
});
