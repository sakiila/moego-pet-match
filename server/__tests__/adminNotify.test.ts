import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.ts';
import { formatAdminEvent, slackAdminNotifier, type AdminEvent } from '../src/services/adminNotify.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import { freshDatabase } from './helpers.ts';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(2048, 1)]);
const AT = new Date('2026-10-25T06:05:00Z'); // 北京 14:05

describe('通知文字', () => {
  it('上传：主人、宠物名、主人说、文件与取走命令', () => {
    const text = formatAdminEvent({ kind: 'submission', submissionId: 's1', playerId: 'U1', playerName: 'Bob 包博', petName: 'Oreo', ownerQuote: 'Hi', contentType: 'image/png', sizeBytes: 2048, at: AT });
    expect(text).toContain('新的宠物照片上传');
    expect(text).toContain('Bob 包博（<@U1>）');
    expect(text).toContain('宠物名：Oreo');
    expect(text).toContain('主人说：Hi');
    expect(text).toContain('image/png · 2 KB');
    expect(text).toContain('2026-10-25 14:05（北京）');
    expect(text).toContain('submissions.ts pull');
  });

  it('删除申请：一般申请与指定宠物', () => {
    const base = { kind: 'deletion', requestId: 'r1', playerId: 'U1', playerName: 'Bob', note: null, at: AT } as const;
    expect(formatAdminEvent({ ...base, petId: null, petName: null })).toContain('一般申请');
    const text = formatAdminEvent({ ...base, petId: 'tofu', petName: 'Tofu', note: '请删除' });
    expect(text).toContain('Tofu（`tofu`）');
    expect(text).toContain('补充说明：请删除');
    expect(text).not.toContain('主人说');
  });

  it('玩家填写的文字被转义，不能拼出全员提醒或链接', () => {
    const text = formatAdminEvent({ kind: 'deletion', requestId: 'r', playerId: 'U1', playerName: 'A', petId: null, petName: null, note: '<!channel> <https://x.y|点我> & co', at: AT });
    expect(text).toContain('&lt;!channel&gt; &lt;https://x.y|点我&gt; &amp; co');
    expect(text).not.toContain('<!channel>');
  });
});

describe('Slack 发送', () => {
  it('未配置令牌或接收人时不发送', () => {
    expect(slackAdminNotifier(undefined, 'U1')).toBeNull();
    expect(slackAdminNotifier('xoxb', undefined)).toBeNull();
  });

  it('用 chat.postMessage 发给配置的接收人；Slack 报错时抛出', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    const notify = slackAdminNotifier('xoxb-t', 'U_BOB', { fetchImpl })!;
    const event: AdminEvent = { kind: 'deletion', requestId: 'r', playerId: 'U1', playerName: 'A', petId: null, petName: null, note: null, at: AT };
    await notify(event);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://slack.com/api/chat.postMessage');
    expect(init.headers).toMatchObject({ authorization: 'Bearer xoxb-t' });
    expect(JSON.parse(init.body as string)).toMatchObject({ channel: 'U_BOB', text: formatAdminEvent(event) });

    fetchImpl.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: 'missing_scope' })));
    await expect(notify(event)).rejects.toThrow('missing_scope');
  });
});

describe('保存后通知', () => {
  let ctx: Awaited<ReturnType<typeof freshDatabase>>;
  let app: ReturnType<typeof buildApp>;
  const sent: AdminEvent[] = [];
  let failNotify = false;

  beforeAll(async () => {
    ctx = await freshDatabase();
    await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_BOB' WHERE pet_id = 'tofu'`);
    app = buildApp({
      pool: ctx.pool,
      now: () => AT,
      images: { cache: new DiskCache(mkdtempSync(join(tmpdir(), 'pm-notify-')), 1024 * 1024), store: memoryStore(), fetchAvatar: async () => null },
      notify: async (event) => {
        if (failNotify) throw new Error('slack down');
        sent.push(event);
      },
    });
  });
  afterAll(async () => {
    await app.close();
    await ctx.app.close();
    await ctx.pool.end();
  });
  beforeEach(async () => {
    sent.length = 0;
    failNotify = false;
    await ctx.pool.query('DELETE FROM pet_match.deletion_requests');
  });
  // 通知不阻塞响应，给后台发送留一点时间
  const settle = () => new Promise((r) => setTimeout(r, 50));

  function upload(fields: Record<string, string>) {
    const boundary = '----pmnotify';
    const head = Object.entries(fields).map(([k, v]) => `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`).join('')
      + `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`;
    const payload = Buffer.concat([Buffer.from(head), PNG, Buffer.from(`\r\n--${boundary}--\r\n`)]);
    return app.inject({ method: 'POST', url: '/api/submissions', payload, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } });
  }
  const requestDeletion = (payload: object) => app.inject({ method: 'POST', url: '/api/deletion-requests', payload });

  it('上传成功后通知一次，带编号、名字与文件信息', async () => {
    const res = await upload({ playerId: 'U_TEST_BOB', petName: 'Oreo', ownerQuote: 'Hello' });
    expect(res.statusCode).toBe(200);
    await settle();
    expect(sent).toEqual([expect.objectContaining({ kind: 'submission', submissionId: res.json().submissionId, playerId: 'U_TEST_BOB', petName: 'Oreo', ownerQuote: 'Hello', contentType: 'image/png', sizeBytes: PNG.length })]);
    expect(res.json()).toEqual({ submissionId: res.json().submissionId });
  });

  it('被拒的上传不通知', async () => {
    expect((await upload({ playerId: 'U_NOBODY', petName: 'Oreo' })).statusCode).toBe(404);
    await settle();
    expect(sent).toEqual([]);
  });

  it('新的删除申请通知一次；同一只宠物重复提交返回原申请，不再通知', async () => {
    const a = await requestDeletion({ playerId: 'U_TEST_BOB', petId: 'tofu', note: '请下架' });
    expect(a.json()).toEqual({ requestId: a.json().requestId, status: 'pending' });
    await requestDeletion({ playerId: 'U_TEST_BOB', petId: 'tofu' });
    await settle();
    expect(sent).toEqual([expect.objectContaining({ kind: 'deletion', requestId: a.json().requestId, petId: 'tofu', note: '请下架' })]);
    expect((sent[0] as Extract<AdminEvent, { kind: 'deletion' }>).petName).toBeTruthy();
  });

  it('通知发送失败不影响玩家的提交', async () => {
    failNotify = true;
    expect((await requestDeletion({ playerId: 'U_TEST_BOB' })).statusCode).toBe(200);
    expect((await upload({ playerId: 'U_TEST_BOB', petName: 'Oreo' })).statusCode).toBe(200);
    await settle();
    expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.deletion_requests')).rows[0].n).toBe(1);
  });
});
