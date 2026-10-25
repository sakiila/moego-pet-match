import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.ts';
import { previewableLinks, unfurlBlocks, verifySlackSignature } from '../src/services/slackUnfurl.ts';
import { freshDatabase } from './helpers.ts';

const SECRET = 'test-signing-secret';
const now = () => Math.floor(Date.now() / 1000);
const sign = (body: string, ts = String(now())) => ({
  'x-slack-request-timestamp': ts,
  'x-slack-signature': `v0=${createHmac('sha256', SECRET).update(`v0:${ts}:${body}`).digest('hex')}`,
});

describe('请求签名', () => {
  it('正确签名通过；改了内容、密钥不对或时间过旧都拒绝', () => {
    const body = '{"type":"x"}';
    const h = sign(body);
    expect(verifySlackSignature(SECRET, body, h['x-slack-request-timestamp'], h['x-slack-signature'])).toBe(true);
    expect(verifySlackSignature(SECRET, body + ' ', h['x-slack-request-timestamp'], h['x-slack-signature'])).toBe(false);
    expect(verifySlackSignature('other', body, h['x-slack-request-timestamp'], h['x-slack-signature'])).toBe(false);
    const old = sign(body, String(now() - 600));
    expect(verifySlackSignature(SECRET, body, old['x-slack-request-timestamp'], old['x-slack-signature'])).toBe(false);
    expect(verifySlackSignature(SECRET, body, undefined, undefined)).toBe(false);
  });
});

describe('预览内容', () => {
  it('只处理游戏首页链接，去重', () => {
    expect(previewableLinks({ type: 'link_shared', links: [
      { url: 'https://star.baobo.me/?v=1' }, { url: 'https://star.baobo.me/?v=1' }, { url: 'https://star.baobo.me/' },
      { url: 'https://star.baobo.me/dev/gallery' }, { url: 'https://evil.example/?x=https://star.baobo.me/' },
    ] })).toEqual(['https://star.baobo.me/?v=1', 'https://star.baobo.me/']);
  });

  it('标题链接与简介，下面是整宽海报', () => {
    const { blocks } = unfurlBlocks('https://star.baobo.me/', { title: 'A <b>', description: 'D & E', alt: 'Alt' }, '20261025.7');
    expect(blocks[0]).toEqual({ type: 'section', text: { type: 'mrkdwn', text: '*<https://star.baobo.me/|A &lt;b&gt;>*\nD &amp; E' } });
    expect(blocks[1]).toEqual({ type: 'image', image_url: 'https://star.baobo.me/og.jpg?v=20261025.7', alt_text: 'Alt', image_width: 1200, image_height: 630 });
  });
});

describe('事件入口', () => {
  let ctx: Awaited<ReturnType<typeof freshDatabase>>;
  let app: ReturnType<typeof buildApp>;
  const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true })));

  beforeAll(async () => {
    ctx = await freshDatabase();
    app = buildApp({ pool: ctx.pool, gameVersion: '20261025.7', slack: { signingSecret: SECRET, token: 'xoxb-test', fetchImpl: fetchImpl as unknown as typeof fetch } });
  });
  afterAll(async () => {
    await app.close();
    await ctx.app.close();
    await ctx.pool.end();
  });
  beforeEach(() => fetchImpl.mockClear());

  const send = (payload: object, headers: Record<string, string> = {}) => {
    const body = JSON.stringify(payload);
    return app.inject({ method: 'POST', url: '/api/slack/events', payload: body, headers: { 'content-type': 'application/json', ...sign(body), ...headers } });
  };
  const settle = () => new Promise((r) => setTimeout(r, 50));
  const linkShared = (event: object) => ({ type: 'event_callback', event: { type: 'link_shared', links: [{ domain: 'star.baobo.me', url: 'https://star.baobo.me/?v=2' }], ...event } });

  it('未配置时不开放', async () => {
    expect((await ctx.app.inject({ method: 'POST', url: '/api/slack/events', payload: {} })).statusCode).toBe(404);
  });

  it('签名不对返回 401，不调用 Slack', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/slack/events', payload: '{"type":"url_verification","challenge":"c"}', headers: { 'content-type': 'application/json', 'x-slack-request-timestamp': String(now()), 'x-slack-signature': 'v0=bad' } });
    expect(res.statusCode).toBe(401);
  });

  it('应答 URL 验证', async () => {
    const res = await send({ type: 'url_verification', challenge: 'abc' });
    expect(res.json()).toEqual({ challenge: 'abc' });
  });

  it('已发出的消息：按频道与时间戳 chat.unfurl 整宽海报', async () => {
    expect((await send(linkShared({ channel: 'C1', message_ts: '123.456' }))).statusCode).toBe(200);
    await settle();
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://slack.com/api/chat.unfurl');
    expect(init.headers).toMatchObject({ authorization: 'Bearer xoxb-test' });
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ channel: 'C1', ts: '123.456' });
    expect(body.unfurls['https://star.baobo.me/?v=2'].blocks[1]).toMatchObject({ type: 'image', image_url: 'https://star.baobo.me/og.jpg?v=20261025.7' });
  });

  it('输入框预览用 unfurl_id 与 source', async () => {
    await send(linkShared({ channel: 'COMPOSER', message_ts: 'x', unfurl_id: 'U1', source: 'composer' }));
    await settle();
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ unfurl_id: 'U1', source: 'composer' });
    expect(body.channel).toBeUndefined();
  });

  it('Slack 重试与非游戏首页链接不再调用', async () => {
    await send(linkShared({ channel: 'C1', message_ts: '1' }), { 'x-slack-retry-num': '1' });
    await send({ type: 'event_callback', event: { type: 'link_shared', channel: 'C1', message_ts: '1', links: [{ url: 'https://star.baobo.me/dev/gallery' }] } });
    await settle();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
