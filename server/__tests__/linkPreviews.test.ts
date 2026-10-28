import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import type { Pool } from '../src/db/pool.ts';

const ORIGIN = 'https://star.baobo.me';
const index = `<!doctype html><html><head>
<title>Pet All-Stars</title>
<meta property="og:title" content="Pets &amp; Friends" />
<meta property="og:description" content="A pet game" />
<meta property="og:url" content="${ORIGIN}/" />
<meta property="og:image" content="${ORIGIN}/og.jpg" />
<meta property="og:image:alt" content="Our pets" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Pets &amp; Friends" />
<meta name="twitter:description" content="A pet game" />
<meta name="twitter:image" content="${ORIGIN}/og.jpg" />
<meta name="twitter:image:alt" content="Our pets" />
</head><body><div id="root"></div><script src="/assets/game.js"></script></body></html>`;

let app: ReturnType<typeof buildApp>;
let dist: string;
beforeAll(async () => {
  dist = mkdtempSync(join(tmpdir(), 'pet-match-link-previews-'));
  writeFileSync(join(dist, 'index.html'), index);
  writeFileSync(join(dist, 'og.jpg'), await sharp({ create: { width: 1200, height: 1200, channels: 3, background: '#fff' } }).jpeg().toBuffer());
  app = buildApp({ pool: {} as Pool, staticDir: dist });
  await app.ready();
});
afterAll(async () => {
  await app.close();
  rmSync(dist, { recursive: true, force: true });
});

const get = (url: string) => app.inject({ method: 'GET', url });
const embedUrl = (page: string, extra = '') => `/api/oembed?url=${encodeURIComponent(page)}${extra}`;
const localUrl = (absolute: string) => { const u = new URL(absolute); return u.pathname + u.search; };

describe('普通 Slack 分享标签对照', () => {
  it('默认首页和未知实验参数仍提供原游戏页面', async () => {
    for (const url of ['/', '/?unfurl=unknown', '/?v=123']) {
      const res = await get(url);
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(index);
      expect(res.headers['cache-control']).toBe('no-cache');
    }
  });

  it('OG 对照移除 Twitter 字段，并为当前链接提供独立 og:url', async () => {
    const res = await get('/?unfurl=og&v=trial');
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain('twitter:');
    expect(res.body).not.toContain('application/json+oembed');
    expect(res.body).toContain(`${ORIGIN}/?unfurl=og&amp;v=trial`);
    expect(res.body).toContain('<script src="/assets/game.js"></script>');
  });

  it('Twitter 对照保留完整的大图字段', async () => {
    const res = await get('/?unfurl=twitter');
    expect(res.body).toContain('name="twitter:card" content="summary_large_image"');
    expect(res.body).toContain('name="twitter:image"');
    expect(res.body).not.toContain('application/json+oembed');
    expect(res.body).toContain(`${ORIGIN}/?unfurl=twitter`);
  });

  it.each(['oembed-photo', 'oembed-rich'])('%s 提供包含当前完整网址的发现链接', async (mode) => {
    const res = await get(`/?unfurl=${mode}&v=trial`);
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain('twitter:');
    const href = res.body.match(/<link\b[^>]*type="application\/json\+oembed"[^>]*href="([^"]+)"/i)?.[1];
    expect(href).toBeTruthy();
    const discovery = new URL(href!.replaceAll('&amp;', '&'));
    expect(discovery.origin).toBe(ORIGIN);
    expect(discovery.pathname).toBe('/api/oembed');
    expect(discovery.searchParams.get('format')).toBe('json');
    expect(discovery.searchParams.get('url')).toBe(`${ORIGIN}/?unfurl=${mode}&v=trial`);
  });

  it('查询参数不能注入 HTML 属性或标签', async () => {
    const res = await get('/?unfurl=og&v=%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    expect(res.body).not.toContain('<script>alert(1)</script>');
    expect(res.body.match(/<script\b/g)).toHaveLength(1);
  });
});

describe('原生海报分享入口', () => {
  const url = '/share.jpg?v=trial';
  const slackAgents = [
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Slackbot 1.0 (+https://api.slack.com/robots)',
    'Slack-ImgProxy 0.19 (+https://api.slack.com/robots)',
  ];

  it.each(slackAgents)('%s 获取完整 JPEG，且不缓存按 UA 区分的响应', async (agent) => {
    const res = await app.inject({ method: 'GET', url, headers: { 'user-agent': agent, accept: 'text/html,*/*' } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(res.rawPayload).toEqual(readFileSync(join(dist, 'og.jpg')));
    expect(res.headers.vary).toBe('User-Agent');
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers.location).toBeUndefined();
  });

  it.each(['GET', 'HEAD'] as const)('普通浏览器的 %s 跳转到游戏首页，不接受任意跳转目标', async (method) => {
    const res = await app.inject({ method, url: `${url}&next=https%3A%2F%2Fevil.test%2F`, headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' } });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
    expect(res.headers.vary).toBe('User-Agent');
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers['content-type'] ?? '').not.toContain('image/');
  });

  it('缺少 UA 或仅在其他 UA 内含 Slack 字样时仍跳转游戏', async () => {
    for (const agent of [undefined, 'Mozilla/5.0 Slackbot 1.0', 'Slackbot-Impostor 1.0']) {
      const res = await app.inject({ method: 'GET', url, headers: agent ? { 'user-agent': agent } : {} });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/');
    }
  });

  it('Slack 的 HEAD 提供图片信息且没有响应体', async () => {
    const res = await app.inject({ method: 'HEAD', url, headers: { 'user-agent': slackAgents[0] } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(Number(res.headers['content-length'])).toBe(readFileSync(join(dist, 'og.jpg')).length);
    expect(res.body).toBe('');
    expect(res.headers['cache-control']).toBe('private, no-store');
  });

  it('支持 Slack 的 Range 探测，分段响应也禁止缓存', async () => {
    const res = await app.inject({ method: 'GET', url, headers: { 'user-agent': slackAgents[0], range: 'bytes=0-1023' } });
    expect(res.statusCode).toBe(206);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(res.rawPayload).toEqual(readFileSync(join(dist, 'og.jpg')).subarray(0, 1024));
    expect(res.headers['content-range']).toMatch(/^bytes 0-1023\//);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers.vary).toBe('User-Agent');
  });
});

describe('标准 oEmbed 表示', () => {
  it('photo 返回公开海报和真实原始尺寸', async () => {
    const res = await get(embedUrl(`${ORIGIN}/?unfurl=oembed-photo`));
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.json()).toMatchObject({ version: '1.0', type: 'photo', title: 'Pets & Friends', width: 1200, height: 1200 });
    const image = await get(localUrl(res.json().url));
    expect(image.statusCode).toBe(200);
    expect(image.headers['content-type']).toContain('image/jpeg');
    expect(await sharp(image.rawPayload).metadata()).toMatchObject({ width: 1200, height: 1200 });
  });

  it.each([[401, 100], [92, 630], [1200, 49], [1, 1]])('遵守 %i×%i 尺寸约束，且声明与实际 JPEG 一致', async (maxwidth, maxheight) => {
    const res = await get(embedUrl(`${ORIGIN}/?unfurl=oembed-photo`, `&maxwidth=${maxwidth}&maxheight=${maxheight}`));
    expect(res.statusCode).toBe(200);
    const embed = res.json();
    expect(embed.width).toBeLessThanOrEqual(maxwidth);
    expect(embed.height).toBeLessThanOrEqual(maxheight);
    if (embed.width > 1 && embed.height > 1) expect(Math.abs(embed.width / embed.height - 1200 / 1200)).toBeLessThan(0.05);
    const image = await get(localUrl(embed.url));
    expect(image.statusCode).toBe(200);
    expect(await sharp(image.rawPayload).metadata()).toMatchObject({ width: embed.width, height: embed.height });
  });

  it('rich 返回定尺寸的完整图片 HTML，并保留原游戏链接', async () => {
    const page = `${ORIGIN}/?unfurl=oembed-rich&v=trial`;
    const res = await get(embedUrl(page, '&format=json&maxwidth=640'));
    expect(res.statusCode).toBe(200);
    const embed = res.json();
    expect(embed).toMatchObject({ type: 'rich', width: 640, height: 640 });
    expect(embed.html).toContain('<img ');
    expect(embed.html).toContain(`href="${ORIGIN}/?unfurl=oembed-rich&amp;v=trial"`);
    expect(embed.html).toContain('width="640"');
    expect(embed.html).not.toContain('<iframe');
    expect(embed.html).not.toContain('<script');
  });

  it.each(['https://example.com/', 'https://star.baobo.me.evil.test/', 'http://star.baobo.me/', 'https://user@star.baobo.me/', `${ORIGIN}/api/players/1`])('不为站外或非首页地址生成表示：%s', async (url) => {
    expect((await get(embedUrl(url))).statusCode).toBe(404);
  });

  it('缺少 url 或非法尺寸返回 400，不支持的格式返回 501', async () => {
    expect((await get('/api/oembed')).statusCode).toBe(400);
    for (const value of ['0', '-1', 'NaN', '1.5', '10001']) {
      expect((await get(embedUrl(`${ORIGIN}/`, `&maxwidth=${value}`))).statusCode).toBe(400);
    }
    expect((await get(embedUrl(`${ORIGIN}/`, '&format=xml'))).statusCode).toBe(501);
  });

  it('超出原图的尺寸约束不放大图片；未知参数可忽略', async () => {
    const res = await get(embedUrl(`${ORIGIN}/`, '&maxwidth=5000&maxheight=5000&other=ignored'));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ width: 1200, height: 1200 });
  });

  it('不同尺寸的突发请求不会无限进入 Sharp 队列，忙时可重试', async () => {
    let peakQueue = 0;
    const measure = (length: number) => { peakQueue = Math.max(peakQueue, length); };
    sharp.queue.on('change', measure);
    try {
      const results = await Promise.all(Array.from({ length: 40 }, (_, i) => get(`/api/oembed/image?maxwidth=${600 + i}`)));
      expect(peakQueue).toBeLessThanOrEqual(4);
      const busy = results.filter((res) => res.statusCode === 503);
      expect(busy.length).toBeGreaterThan(0);
      for (const res of busy) expect(res.headers['retry-after']).toBe('1');
      for (const res of results) expect([200, 503]).toContain(res.statusCode);
    } finally { sharp.queue.removeListener('change', measure); }
  });

  it('同一尺寸的并发请求共享一次处理，不因队列上限而被拒绝', async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => get('/api/oembed/image?maxwidth=927')));
    expect(results.every((res) => res.statusCode === 200)).toBe(true);
  });

  it('不提供静态目录时不注册生产分享接口', async () => {
    const dev = buildApp({ pool: {} as Pool });
    try { expect((await dev.inject({ method: 'GET', url: embedUrl(`${ORIGIN}/`) })).statusCode).toBe(404); }
    finally { await dev.close(); }
  });

  it('对照入口不修改磁盘中的首页文件', () => {
    expect(readFileSync(join(dist, 'index.html'), 'utf8')).toBe(index);
  });
});
