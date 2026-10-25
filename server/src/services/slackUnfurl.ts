import { createHmac, timingSafeEqual } from 'node:crypto';
import { POSTER_HEIGHT, POSTER_URL, POSTER_WIDTH, supportedPreviewPage } from './linkPreview.ts';

/**
 * Slack App 链接预览：普通网页标签在 Slack 里只显示右侧缩略图，
 * 由 App 收到 link_shared 后用 chat.unfurl 回一张整宽海报卡片。
 * 需要 Bot 权限 links:read、links:write，并在 App 设置里登记 star.baobo.me 为预览域名。
 */

/** 请求签名有效期：Slack 建议拒绝 5 分钟以前的请求，防止重放。 */
const MAX_SKEW_SECONDS = 5 * 60;

export function verifySlackSignature(secret: string, rawBody: string, timestamp: string | undefined, signature: string | undefined, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_SKEW_SECONDS) return false;
  const expected = Buffer.from(`v0=${createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`);
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export interface PreviewText {
  title: string;
  description: string;
  alt: string;
}

const escapeMrkdwn = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 一个链接的预览：标题链接 + 简介，下面是整宽海报。 */
export function unfurlBlocks(link: string, text: PreviewText, version?: string) {
  const image = version ? `${POSTER_URL}?v=${encodeURIComponent(version)}` : POSTER_URL;
  return {
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*<${link}|${escapeMrkdwn(text.title)}>*\n${escapeMrkdwn(text.description)}` } },
      { type: 'image', image_url: image, alt_text: text.alt, image_width: POSTER_WIDTH, image_height: POSTER_HEIGHT },
    ],
  };
}

export interface LinkSharedEvent {
  type: 'link_shared';
  channel?: string;
  message_ts?: string;
  unfurl_id?: string;
  source?: string;
  links?: { domain?: string; url?: string }[];
}

/** 只给游戏首页的链接生成预览；其他链接交回 Slack 默认处理。 */
export function previewableLinks(event: LinkSharedEvent): string[] {
  return [...new Set((event.links ?? []).map((l) => l.url ?? '').filter((url) => supportedPreviewPage(url)))];
}

export async function postUnfurl(token: string, event: LinkSharedEvent, text: PreviewText, version: string | undefined, fetchImpl: typeof fetch = fetch) {
  const links = previewableLinks(event);
  if (!links.length) return;
  // 输入框里的预览（source=composer）用 unfurl_id；已发出的消息用频道与时间戳
  const target = event.unfurl_id && event.source ? { unfurl_id: event.unfurl_id, source: event.source } : { channel: event.channel, ts: event.message_ts };
  const res = await fetchImpl('https://slack.com/api/chat.unfurl', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ...target, unfurls: Object.fromEntries(links.map((link) => [link, unfurlBlocks(link, text, version)])) }),
  });
  const json = (await res.json()) as { ok?: boolean; error?: string };
  if (!json.ok) throw new Error(`slack chat.unfurl: ${json.error ?? res.status}`);
}
