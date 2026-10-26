import sharp from 'sharp';
import { createHmac } from 'node:crypto';
import { buildApp } from '../src/app.ts';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { freshDatabase } from './helpers.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import { acceptSyncEvent, claimSyncJob, enqueueSync, syncEvent } from '../src/social/events.ts';
import { fetchSlackPhoto, type SlackMessage, type SlackFile } from '../src/social/slackApi.ts';
import { markFileDeleted, markSourceDeleted, syncMessage, sourceKey } from '../src/social/sync.ts';
import { pollSlackChannel, processSyncJob } from '../src/social/worker.ts';
import { getPost, listPosts } from '../src/social/read.ts';
import { removeSocialPost } from '../src/social/write.ts';

describe('Slack 单向同步与重启恢复', () => {
  let ctx: Awaited<ReturnType<typeof freshDatabase>>;
  const store = memoryStore();
  let png: Buffer;
  const messages = new Map<string, SlackMessage>();
  const files = new Map<string, SlackFile>();
  let failNext = false;
  let partial = false;
  const fetchImpl = vi.fn(async (raw: string | URL) => {
    const url = new URL(raw);
    if (failNext) {
      failNext = false;
      throw new Error('temporary network failure');
    }
    if (url.hostname === 'files.slack.com')
      return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
    if (url.pathname.endsWith('conversations.history')) {
      expect(url.searchParams.get('channel')).toBe('C_TARGET');
      const single = url.searchParams.get('limit') === '1';
      const ts = url.searchParams.get('latest');
      return Response.json({
        ok: true,
        messages: single ? (ts && messages.has(ts) ? [messages.get(ts)] : []) : [...messages.values()],
        has_more: partial,
        response_metadata: { next_cursor: partial ? 'more' : '' },
      });
    }
    if (url.pathname.endsWith('files.info')) {
      const file = files.get(url.searchParams.get('file')!);
      return Response.json(file ? { ok: true, file } : { ok: false, error: 'file_not_found' });
    }
    if (url.pathname.endsWith('chat.getPermalink'))
      return Response.json({
        ok: true,
        permalink: `https://moego.slack.com/archives/C_TARGET/p${url.searchParams.get('message_ts')?.replace('.', '')}`,
      });
    throw new Error('Unexpected outbound method');
  });
  const config = {
    teamId: 'T_TARGET',
    channelId: 'C_TARGET',
    token: 'test-token-never-in-output',
    fetchImpl: fetchImpl as typeof fetch,
    requestGapMs: 0,
  };
  const ts = '1792599404.599959';
  const later = '1792599405.000001';
  const file = (id = 'F1'): SlackFile => ({
    id,
    mimetype: 'image/png',
    url_private: `https://files.slack.com/${id}.png`,
    size: 1000,
  });
  const message = (body = 'A puppy :sparkling_heart:', ids = ['F1']): SlackMessage => ({
    ts,
    user: 'U_TEST_BOB',
    text: body,
    files: ids.map((id) => file(id)),
  });
  const currentId = async () =>
    (await ctx.pool.query('SELECT id FROM pet_match.social_posts WHERE source_key=$1', [sourceKey(config, ts)])).rows[0]
      .id as string;
  beforeAll(async () => {
    ctx = await freshDatabase(false);
    png = await sharp({ create: { width: 80, height: 60, channels: 3, background: '#bba077' } })
      .png()
      .toBuffer();
  });
  beforeEach(async () => {
    await ctx.pool.query(
      'TRUNCATE pet_match.social_posts,pet_match.social_slack_jobs,pet_match.social_deleted_files,pet_match.social_sync_state CASCADE',
    );
    messages.clear();
    files.clear();
    files.set('F1', file());
    messages.set(ts, message());
    store.objects.clear();
    fetchImpl.mockClear();
    failNext = false;
    partial = false;
  });
  afterAll(async () => {
    await ctx.app.close();
    await ctx.pool.end();
  });
  it('仅接受目标工作区和频道的主帖，忽略机器人、回复和表情', () => {
    const payload = {
      type: 'event_callback',
      team_id: 'T_TARGET',
      event: { type: 'message', channel: 'C_TARGET', ts, user: 'U_TEST_BOB', event_ts: later },
    };
    expect(syncEvent(payload, config)).toEqual({ type: 'message', ts, version: later });
    expect(syncEvent({ ...payload, team_id: 'OTHER' }, config)).toBeNull();
    expect(syncEvent({ ...payload, event: { ...payload.event, channel: 'OTHER' } }, config)).toBeNull();
    expect(syncEvent({ ...payload, event: { ...payload.event, thread_ts: '1792500000.000001' } }, config)).toBeNull();
    expect(syncEvent({ ...payload, event: { ...payload.event, bot_id: 'B1' } }, config)).toBeNull();
    expect(syncEvent({ ...payload, event: { type: 'reaction_added' } }, config)).toBeNull();
  });
  it('事件重试只留一份定位信息，不保存频道正文或私有照片 URL', async () => {
    const payload = {
      type: 'event_callback',
      team_id: 'T_TARGET',
      event_id: 'E1',
      event: { type: 'message', channel: 'C_TARGET', ts, event_ts: later, text: 'private text', files: [file()] },
    };
    await Promise.all([acceptSyncEvent(ctx.pool, payload, config), acceptSyncEvent(ctx.pool, payload, config)]);
    const rows = (await ctx.pool.query('SELECT * FROM pet_match.social_slack_jobs')).rows;
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows[0].event)).not.toContain('private text');
    expect(JSON.stringify(rows[0].event)).not.toContain('https:');
    await processSyncJob(ctx.pool, store, config);
    expect((await ctx.pool.query('SELECT event,done_at FROM pet_match.social_slack_jobs')).rows[0]).toMatchObject({
      event: {},
      done_at: expect.any(Date),
    });
  });
  it('真实 webhook 先入队；签名不对拒绝，Slack 重试仍只入队一次', async () => {
    const app = buildApp({
      pool: ctx.pool,
      social: { publicOrigin: 'http://localhost', adminIds: [], startWorker: false, sync: config },
      slack: { token: 'test-token', signingSecret: 'signing-test-secret' },
    });
    try {
      const payload = JSON.stringify({
        type: 'event_callback',
        team_id: 'T_TARGET',
        event_id: 'WEBHOOK',
        event: { type: 'message', channel: 'C_TARGET', ts, event_ts: later, user: 'U_TEST_BOB' },
      });
      const timestamp = String(Math.floor(Date.now() / 1000));
      const headers = {
        'content-type': 'application/json',
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': `v0=${createHmac('sha256', 'signing-test-secret').update(`v0:${timestamp}:${payload}`).digest('hex')}`,
      };
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/slack/events',
            payload,
            headers: { ...headers, 'x-slack-signature': 'v0=bad' },
          })
        ).statusCode,
      ).toBe(401);
      expect((await app.inject({ method: 'POST', url: '/api/slack/events', payload, headers })).statusCode).toBe(200);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/slack/events',
            payload,
            headers: { ...headers, 'x-slack-retry-num': '1' },
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (await ctx.pool.query("SELECT count(*)::int AS n FROM pet_match.social_slack_jobs WHERE event_id='WEBHOOK'"))
          .rows[0].n,
      ).toBe(1);
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
  it('导入照片和原时间，不导入 Slack 的回复、赞数，不写回 Slack', async () => {
    messages.set(ts, { ...message(), reactions: [{ count: 99 }], reply_count: 8 } as SlackMessage);
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    const view = await getPost(ctx.pool, await currentId(), 'U_TEST_BOB');
    expect(view.body).toBe('A puppy 💖');
    expect(view.photos).toHaveLength(1);
    expect(view.comments).toEqual([]);
    expect(view.reactionCounts).toEqual({ paw: 0, heart: 0, bone: 0 });
    expect(view.createdAt).toBe('2026-10-21T16:16:44.599Z');
    expect(view.author.id).toBe('U_TEST_BOB');
    expect(view.sourceUrl).toContain('/archives/C_TARGET/');
    expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.games')).rows[0].n).toBe(0);
    expect(
      fetchImpl.mock.calls.every(
        ([url]) =>
          ['conversations.history', 'chat.getPermalink', 'files.info'].some(
            (m) => String(url).endsWith(m) || String(url).includes(m + '?'),
          ) || String(url).startsWith('https://files.slack.com/'),
      ),
    ).toBe(true);
  });
  it('重复同步复用图片，更新正文不改原始发布时间', async () => {
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    const id = await currentId();
    const original = await getPost(ctx.pool, id, 'U_TEST_BOB');
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    expect(store.objects.size).toBe(1);
    messages.set(ts, { ...message('New caption'), edited: { ts: later } });
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: later });
    const updated = await getPost(ctx.pool, id, 'U_TEST_BOB');
    expect(updated.body).toBe('New caption');
    expect(updated.createdAt).toBe(original.createdAt);
    expect(store.objects.size).toBe(1);
  });
  it('解码 Slack 转义和常用表情，保留用户输入的字面实体', async () => {
    messages.set(ts, message('A &amp; B &lt;3 :eyes: &amp;lt;'));
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    expect((await getPost(ctx.pool, await currentId(), 'U_TEST_BOB')).body).toBe('A & B <3 👀 &lt;');
  });
  it('相同内容的新版本也推进时序，晚到的旧编辑不能覆盖', async () => {
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    const newer = '1792599406.000002';
    messages.set(ts, { ...message(), edited: { ts: newer } });
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: newer });
    messages.set(ts, { ...message('stale text'), edited: { ts: '1792599406.000001' } });
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: '1792599406.000001' });
    expect((await getPost(ctx.pool, await currentId(), 'U_TEST_BOB')).body).toBe('A puppy 💖');
  });
  it('删除事件先到也留下墓碑，迟来的创建不能复活照片', async () => {
    await markSourceDeleted(ctx.pool, config, ts, later);
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: '1792599406.000003' });
    expect((await listPosts(ctx.pool, 'U_TEST_BOB')).posts).toEqual([]);
    expect(store.objects.size).toBe(0);
  });
  it('作者在本站隐藏后，Slack 再编辑也不重新显示', async () => {
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    const id = await currentId();
    await removeSocialPost(ctx.pool, id, 'U_TEST_BOB', false);
    messages.set(ts, { ...message('edited after hide'), edited: { ts: later } });
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: later });
    expect((await listPosts(ctx.pool, 'U_TEST_BOB')).posts).toEqual([]);
    expect((await ctx.pool.query('SELECT body FROM pet_match.social_posts WHERE id=$1', [id])).rows[0].body).toBe('');
  });
  it('纯视频不展示，混合帖仅导入照片', async () => {
    const video = { id: 'FV', mimetype: 'video/mp4', url_private: 'https://files.slack.com/video.mp4' };
    messages.set(ts, { ...message('Video'), files: [video] });
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    expect((await listPosts(ctx.pool, 'U_TEST_BOB')).posts).toEqual([]);
    messages.set(ts, { ...message('Mixed'), edited: { ts: later }, files: [video, file()] });
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: later });
    expect((await listPosts(ctx.pool, 'U_TEST_BOB')).posts[0].photos).toHaveLength(1);
    expect(fetchImpl.mock.calls.some(([url]) => String(url).endsWith('video.mp4'))).toBe(false);
  });
  it('单张文件删除后，后到的旧消息也不能恢复该文件', async () => {
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    await markFileDeleted(ctx.pool, 'F1');
    await syncMessage(ctx.pool, store, config, { type: 'verify', ts, version: later });
    await expect(getPost(ctx.pool, await currentId(), 'U_TEST_BOB')).rejects.toThrow('not_found');
    expect(
      (await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.social_media WHERE deleted_at IS NULL')).rows[0]
        .n,
    ).toBe(0);
  });
  it('临时网络失败持久保留重试，成功后不重复导入', async () => {
    await enqueueSync(ctx.pool, 'RETRY', { type: 'message', ts, version: ts });
    failNext = true;
    await processSyncJob(ctx.pool, store, config);
    let job = (await ctx.pool.query("SELECT * FROM pet_match.social_slack_jobs WHERE event_id='RETRY'")).rows[0];
    expect(job.done_at).toBeNull();
    expect(job.attempts).toBe(1);
    await ctx.pool.query(
      "UPDATE pet_match.social_slack_jobs SET available_at=now()-interval '1 second' WHERE event_id='RETRY'",
    );
    await processSyncJob(ctx.pool, store, config);
    job = (await ctx.pool.query("SELECT * FROM pet_match.social_slack_jobs WHERE event_id='RETRY'")).rows[0];
    expect(job.done_at).not.toBeNull();
    expect(store.objects.size).toBe(1);
  });
  it('文件下载暂时 404 而元数据仍存在时重试，不误记永久删除', async () => {
    const transient = vi.fn(async (raw: string | URL) =>
      new URL(raw).hostname === 'files.slack.com' ? new Response(null, { status: 404 }) : fetchImpl(raw),
    );
    await expect(
      syncMessage(
        ctx.pool,
        store,
        { ...config, fetchImpl: transient as typeof fetch },
        { type: 'message', ts, version: ts },
      ),
    ).rejects.toThrow('file_download_pending');
    expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.social_deleted_files')).rows[0].n).toBe(0);
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    expect((await getPost(ctx.pool, await currentId(), 'U_TEST_BOB')).photos).toHaveLength(1);
  });
  it('任务租约可在进程退出后重领，旧 worker 不能确认新租约', async () => {
    await enqueueSync(ctx.pool, 'LEASE', { type: 'message', ts, version: ts });
    const first = await claimSyncJob(ctx.pool);
    expect(first).toBeTruthy();
    expect(await claimSyncJob(ctx.pool)).toBeUndefined();
    await ctx.pool.query("UPDATE pet_match.social_slack_jobs SET claimed_until=now()-interval '1 second'");
    const second = await claimSyncJob(ctx.pool);
    expect(second?.claim_token).not.toBe(first?.claim_token);
    expect(
      (
        await ctx.pool.query(
          'UPDATE pet_match.social_slack_jobs SET done_at=now() WHERE event_id=$1 AND claim_token=$2',
          [first!.event_id, first!.claim_token],
        )
      ).rowCount,
    ).toBe(0);
  });
  it('不向非 Slack 主机或跳转目标传递令牌', async () => {
    await expect(
      fetchSlackPhoto(config, { ...file(), url_private: 'https://elsewhere.invalid/image.png' }),
    ).rejects.toThrow('invalid_file_host');
    expect(fetchImpl).not.toHaveBeenCalled();
    const redirect = vi.fn(
      async () => new Response(null, { status: 302, headers: { location: 'https://elsewhere.invalid/photo' } }),
    );
    await expect(fetchSlackPhoto({ ...config, fetchImpl: redirect as typeof fetch }, file())).rejects.toThrow(
      'invalid_file_host',
    );
    expect(redirect).toHaveBeenCalledTimes(1);
  });
  it('分页未读完整时不判定删除；完整窗口才补漏删事件', async () => {
    await syncMessage(ctx.pool, store, config, { type: 'message', ts, version: ts });
    messages.clear();
    partial = true;
    await pollSlackChannel(ctx.pool, config);
    expect(
      (
        await ctx.pool.query(
          "SELECT count(*)::int AS n FROM pet_match.social_slack_jobs WHERE event_id LIKE 'missing:%'",
        )
      ).rows[0].n,
    ).toBe(0);
    partial = false;
    await pollSlackChannel(ctx.pool, config);
    expect(
      (
        await ctx.pool.query(
          "SELECT count(*)::int AS n FROM pet_match.social_slack_jobs WHERE event_id LIKE 'missing:%'",
        )
      ).rows[0].n,
    ).toBe(1);
  });
});
