import { randomUUID } from 'node:crypto';
import type { InjectOptions } from 'fastify';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { createSession } from '../src/services/auth.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import { freshDatabase } from './helpers.ts';
import { purgeSocialMedia } from '../src/social/media.ts';

describe('社交服务：真实会话、媒体隔离与事务', () => {
  let ctx: Awaited<ReturnType<typeof freshDatabase>>;
  let app: ReturnType<typeof buildApp>;
  const store = memoryStore();
  let bob: string, alice: string;
  let image: Buffer;
  const owner = 'U_TEST_BOB';
  const other = 'U_TEST_ALICE';
  const auth = (token: string) => ({ cookie: `pet_match_session=${token}` });
  const post = (token: string, path: string, payload: InjectOptions['payload']) =>
    app.inject({ method: 'POST', url: path, payload, headers: auth(token) });
  beforeAll(async () => {
    ctx = await freshDatabase(false);
    // 使用独立本地样例名单，绝不依赖或修改生产身份。
    await ctx.pool.query(
      "INSERT INTO pet_match.slack_members(user_id,name,email,active) VALUES($1,'Alice','alice@moego.pet',true) ON CONFLICT(user_id) DO UPDATE SET active=true",
      [other],
    );
    bob = await createSession(ctx.pool, owner);
    alice = await createSession(ctx.pool, other);
    app = buildApp({
      pool: ctx.pool,
      social: { publicOrigin: 'http://localhost', adminIds: [owner], startWorker: false },
      images: {
        store,
        cache: new DiskCache('/tmp/moego-social-test-cache', 1024 * 1024),
        fetchAvatar: async () => null,
      },
    });
    image = await sharp({ create: { width: 1800, height: 900, channels: 3, background: '#d0a878' } })
      .png()
      .withMetadata({ orientation: 1 })
      .toBuffer();
  });
  afterAll(async () => {
    await app.close();
    await ctx.app.close();
    await ctx.pool.end();
  });
  async function upload(token = bob, buffer = image, type = 'image/png') {
    const boundary = 'social-boundary';
    const data = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="photo.png"\r\nContent-Type: ${type}\r\n\r\n`,
      ),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    return app.inject({
      method: 'POST',
      url: '/api/social/media',
      headers: { ...auth(token), 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: data,
    });
  }
  async function makePost(token = bob, body = 'A little moment', photoIds: string[] = []) {
    const input = { id: randomUUID(), body, photoIds };
    const result = await post(token, '/api/social/posts', input);
    expect(result.statusCode).toBe(200);
    return { input, view: result.json() };
  }
  it('功能默认关闭；开启后内容和照片均要求真实会话', async () => {
    expect((await ctx.app.inject('/api/social/config')).json()).toEqual({ enabled: false });
    expect((await ctx.app.inject('/api/social/posts')).statusCode).toBe(404);
    expect((await app.inject('/api/social/posts')).statusCode).toBe(401);
    expect((await app.inject(`/img/social/${randomUUID()}`)).statusCode).toBe(401);
    const session = await app.inject({ url: '/api/social/session', headers: auth(bob) });
    expect(session.json()).toMatchObject({ viewer: { id: owner }, canModerate: true });
    expect(session.headers['cache-control']).toContain('no-store');
  });
  it('照片重编码、去除元数据；未发布照片只对上传者开放', async () => {
    const result = await upload();
    expect(result.statusCode).toBe(200);
    const photo = result.json();
    const mine = await app.inject({ url: photo.src, headers: auth(bob) });
    expect(mine.statusCode).toBe(200);
    const metadata = await sharp(mine.rawPayload).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(1600);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
    expect((await app.inject({ url: photo.src, headers: auth(alice) })).statusCode).toBe(404);
    const created = await makePost(bob, '', [photo.id]);
    expect(created.view.photos).toHaveLength(1);
    expect((await app.inject({ url: photo.src, headers: auth(alice) })).statusCode).toBe(200);
  });
  it('不接受视频、伪造类型或跨站写入', async () => {
    expect((await upload(bob, Buffer.from('not an image'), 'video/mp4')).statusCode).toBe(415);
    expect((await upload(bob, Buffer.from('<svg/>'), 'image/png')).statusCode).toBe(415);
    const result = await app.inject({
      method: 'POST',
      url: '/api/social/posts',
      headers: { ...auth(bob), origin: 'https://elsewhere.invalid' },
      payload: { id: randomUUID(), body: 'x', photoIds: [] },
    });
    expect(result.statusCode).toBe(403);
  });
  it('作者从 Cookie 确定，不能冒名或偷用他人的暂存图片', async () => {
    const image = (await upload()).json();
    expect(
      (await post(alice, '/api/social/posts', { id: randomUUID(), body: 'x', photoIds: [image.id] })).statusCode,
    ).toBe(409);
    expect(
      (await post(alice, '/api/social/posts', { id: randomUUID(), body: 'x', photoIds: [], authorId: owner }))
        .statusCode,
    ).toBe(400);
    expect(
      (await post(alice, '/api/social/posts', { id: randomUUID(), body: 'x', photoIds: [], petId: 'pet_nonexistent' }))
        .statusCode,
    ).toBe(400);
    const own = await makePost();
    expect(
      (await app.inject({ method: 'DELETE', url: `/api/social/posts/${own.view.id}`, headers: auth(alice) }))
        .statusCode,
    ).toBe(403);
  });
  it('并发重试同一条发布只保存一份，改变内容的重用 ID 被拒绝', async () => {
    const input = { id: randomUUID(), body: 'Concurrent post', photoIds: [] };
    const results = await Promise.all(Array.from({ length: 5 }, () => post(bob, '/api/social/posts', input)));
    expect(results.map((r) => r.statusCode)).toEqual([200, 200, 200, 200, 200]);
    expect(
      (await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.social_posts WHERE id=$1', [input.id])).rows[0].n,
    ).toBe(1);
    expect((await post(bob, '/api/social/posts', { ...input, body: 'changed' })).statusCode).toBe(409);
  });
  it('表情显式设定且幂等；计数不暴露其他同事的 ID', async () => {
    const { view } = await makePost();
    const url = `/api/social/posts/${view.id}/reactions/play`;
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        app.inject({ method: 'PUT', url, headers: auth(alice), payload: { selected: true } }),
      ),
    );
    expect(results.every((r) => r.statusCode === 200)).toBe(true);
    const result = (await app.inject({ url: `/api/social/posts/${view.id}`, headers: auth(bob) })).json();
    expect(result.reactionCounts.play).toBe(1);
    expect(result.reactions.play).toEqual([]);
    const notices = (await app.inject({ url: '/api/social/notices', headers: auth(bob) })).json();
    expect(notices.notices.filter((n: any) => n.postId === view.id)).toHaveLength(1);
    await app.inject({ method: 'PUT', url, headers: auth(alice), payload: { selected: false } });
    const cancelled = (await app.inject({ url: '/api/social/notices', headers: auth(bob) })).json();
    expect(cancelled.notices.some((n: any) => n.postId === view.id)).toBe(false);
  });
  it('快捷互动只认四种宠物小动作，计数与选中按种类分开', async () => {
    const { view } = await makePost();
    for (const kind of ['cute', 'pets', 'play', 'love']) {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/social/posts/${view.id}/reactions/${kind}`,
        headers: auth(alice),
        payload: { selected: true },
      });
      expect(res.statusCode).toBe(200);
    }
    const result = (await app.inject({ url: `/api/social/posts/${view.id}`, headers: auth(alice) })).json();
    expect(result.reactionCounts).toEqual({ cute: 1, pets: 1, play: 1, love: 1 });
    expect(result.reactions.pets).toEqual(['U_TEST_ALICE']);
    for (const kind of ['paw', 'heart', 'bone', 'comment']) {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/social/posts/${view.id}/reactions/${kind}`,
        headers: auth(alice),
        payload: { selected: true },
      });
      expect(res.statusCode).toBe(400);
    }
  });
  it('自己的表情不产生自己的通知；仅能标记自己的消息', async () => {
    const { view } = await makePost();
    await app.inject({
      method: 'PUT',
      url: `/api/social/posts/${view.id}/reactions/cute`,
      headers: auth(bob),
      payload: { selected: true },
    });
    expect(
      (await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.social_notices WHERE post_id=$1', [view.id]))
        .rows[0].n,
    ).toBe(0);
    await app.inject({
      method: 'PUT',
      url: `/api/social/posts/${view.id}/reactions/love`,
      headers: auth(alice),
      payload: { selected: true },
    });
    const notice = (await app.inject({ url: '/api/social/notices', headers: auth(bob) }))
      .json()
      .notices.find((n: any) => n.postId === view.id);
    await post(alice, '/api/social/notices/read', { id: notice.id });
    expect(
      (await ctx.pool.query('SELECT read_at FROM pet_match.social_notices WHERE id=$1', [notice.id])).rows[0].read_at,
    ).toBeNull();
    await post(bob, '/api/social/notices/read', { id: notice.id });
    expect(
      (await ctx.pool.query('SELECT read_at FROM pet_match.social_notices WHERE id=$1', [notice.id])).rows[0].read_at,
    ).not.toBeNull();
  });
  it('留言重复提交只写一次，回复保持一层，错误目标不产生通知', async () => {
    const { view } = await makePost();
    const input = { id: randomUUID(), body: 'So cute', replyToUserId: owner };
    const results = await Promise.all([
      post(alice, `/api/social/posts/${view.id}/comments`, input),
      post(alice, `/api/social/posts/${view.id}/comments`, input),
    ]);
    expect(results.every((r) => r.statusCode === 200)).toBe(true);
    expect(results[1].json().comments).toHaveLength(1);
    expect(
      (await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.social_notices WHERE comment_id=$1', [input.id]))
        .rows[0].n,
    ).toBe(1);
    expect(
      (
        await post(bob, `/api/social/posts/${view.id}/comments`, {
          id: randomUUID(),
          body: 'reply',
          replyToUserId: 'not-in-this-post',
        })
      ).statusCode,
    ).toBe(400);
    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/social/posts/${view.id}/comments/${input.id}`,
      headers: auth(alice),
    });
    expect(deleted.json().commentCount).toBe(0);
    expect(
      (await ctx.pool.query('SELECT body FROM pet_match.social_comments WHERE id=$1', [input.id])).rows[0].body,
    ).toBe('');
  });
  it('删除撤销照片访问和消息，再异步清理存储；他人不可删除', async () => {
    const photo = (await upload(alice)).json();
    const { view } = await makePost(alice, 'private photo', [photo.id]);
    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: `/api/social/posts/${view.id}`,
          headers: auth(await createSession(ctx.pool, 'U_TEST_NO_SUCH')),
        })
      ).statusCode,
    ).toBe(401);
    await post(bob, `/api/social/posts/${view.id}/comments`, { id: randomUUID(), body: 'comment' });
    expect(
      (await app.inject({ method: 'DELETE', url: `/api/social/posts/${view.id}`, headers: auth(alice) })).statusCode,
    ).toBe(200);
    expect((await app.inject({ url: photo.src, headers: auth(bob) })).statusCode).toBe(404);
    expect((await app.inject({ url: `/api/social/posts/${view.id}`, headers: auth(bob) })).statusCode).toBe(404);
    const key = (await ctx.pool.query('SELECT object_key FROM pet_match.social_media WHERE id=$1', [photo.id])).rows[0]
      .object_key;
    expect(store.objects.has(key)).toBe(true);
    await purgeSocialMedia(ctx.pool, store);
    expect(store.objects.has(key)).toBe(false);
  });
  it('同时间的分页稳定，空正文/空图片不能发布，失效会话不能读', async () => {
    await ctx.pool.query("UPDATE pet_match.social_posts SET created_at='2026-10-26T00:00:00.000Z'");
    const first = await app.inject({ url: '/api/social/posts?limit=2', headers: auth(bob) });
    const page = first.json();
    expect(page.posts).toHaveLength(2);
    expect(page.nextCursor).toBeTruthy();
    const next = (
      await app.inject({ url: `/api/social/posts?limit=2&cursor=${page.nextCursor}`, headers: auth(bob) })
    ).json();
    expect(next.posts.every((p: any) => !page.posts.some((x: any) => x.id === p.id))).toBe(true);
    expect((await post(bob, '/api/social/posts', { id: randomUUID(), body: ' ', photoIds: [] })).statusCode).toBe(400);
    await ctx.pool.query('UPDATE pet_match.player_sessions SET revoked_at=now() WHERE player_id=$1', [other]);
    expect((await app.inject({ url: '/api/social/posts', headers: auth(alice) })).statusCode).toBe(401);
  });
  it('反馈可供管理者查看，普通用户不能读取管理接口或重置队列', async () => {
    const token = await createSession(ctx.pool, other);
    const { view } = await makePost();
    expect(
      (await post(token, '/api/social/reports', { id: randomUUID(), postId: view.id, body: 'Test report' })).statusCode,
    ).toBe(200);
    expect((await app.inject({ url: '/api/social/admin/reports', headers: auth(token) })).statusCode).toBe(403);
    const reports = (await app.inject({ url: '/api/social/admin/reports', headers: auth(bob) })).json();
    expect(reports.reports.some((r: any) => r.postId === view.id && r.body === 'Test report')).toBe(true);
    expect((await post(token, '/api/social/admin/retry', {})).statusCode).toBe(403);
    expect((await post(bob, '/api/social/admin/retry', {})).statusCode).toBe(200);
  });
});
