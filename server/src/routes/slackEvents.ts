import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app.ts';
import { previewMetadata } from '../services/linkPreview.ts';
import { postUnfurl, verifySlackSignature, type LinkSharedEvent, type PreviewText } from '../services/slackUnfurl.ts';

const FALLBACK_TEXT: PreviewText = {
  title: 'MoeGo 毛孩子全明星 · Pet All-Stars',
  description: "和同事家的毛孩子，来一局 90 秒消消乐。A 90-second match-3 with your coworkers' pets.",
  alt: 'MoeGo 毛孩子全明星 · MoeGo Pet All-Stars',
};

/**
 * Slack 事件入口（App 的 Event Subscriptions Request URL）：校验签名，应答 URL 验证，
 * link_shared 先回 200 再在后台 chat.unfurl，避免 Slack 3 秒超时重试。
 */
export const slackEventRoutes: FastifyPluginAsync<AppDeps> = async (app, { slack, staticDir, gameVersion }) => {
  if (!slack) return;
  // 签名按原始请求体计算：本插件内 JSON 不预先解析
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => done(null, body));

  // 标题与简介跟首页分享标签一致
  const previewText = async (): Promise<PreviewText> => {
    if (!staticDir) return FALLBACK_TEXT;
    try {
      const html = await readFile(join(staticDir, 'index.html'), 'utf8');
      const meta = previewMetadata(html);
      return { title: meta.title, alt: meta.alt, description: meta.description ?? FALLBACK_TEXT.description };
    } catch {
      return FALLBACK_TEXT;
    }
  };

  app.post('/api/slack/events', async (request, reply) => {
    const raw = typeof request.body === 'string' ? request.body : '';
    const header = (name: string) => request.headers[name] as string | undefined;
    if (!verifySlackSignature(slack.signingSecret, raw, header('x-slack-request-timestamp'), header('x-slack-signature'))) {
      return reply.status(401).send({ error: 'invalid_signature' });
    }
    let payload: { type?: string; challenge?: string; event?: { type?: string } };
    try {
      payload = JSON.parse(raw);
    } catch {
      return reply.status(400).send({ error: 'invalid_request' });
    }
    if (payload.type === 'url_verification') return { challenge: payload.challenge };
    // 重试说明第一次已收到；预览只需做一次
    if (payload.type === 'event_callback' && payload.event?.type === 'link_shared' && !header('x-slack-retry-num')) {
      const event = payload.event as LinkSharedEvent;
      void previewText()
        .then((text) => postUnfurl(slack.token, event, text, gameVersion ?? undefined, slack.fetchImpl))
        .catch((error) => request.log.warn({ err: error }, 'slack unfurl failed'));
    }
    return reply.status(200).send();
  });
};
