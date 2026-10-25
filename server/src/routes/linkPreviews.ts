import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import { z } from 'zod';
import { isPreviewVariant, oEmbedRepresentation, posterSize, previewMetadata, previewPageUrl, renderPreviewHtml, supportedPreviewPage } from '../services/linkPreview.ts';

const dimension = z.coerce.number().int().min(1).max(10_000).optional();
const dimensions = z.object({ maxwidth: dimension, maxheight: dimension });
const embedQuery = dimensions.extend({ url: z.string().url(), format: z.string().optional() });
const MAX_CACHED_IMAGES = 16;
const MAX_PENDING_IMAGES = 4;
interface ImageEntry { pending: boolean; promise: Promise<Buffer> }

/** 普通预览实验复用游戏首页与固定海报，不需要 Slack App 或工作区权限。 */
export function registerLinkPreviews(app: FastifyInstance, staticDir: string) {
  const indexPath = join(staticDir, 'index.html');
  const posterPath = join(staticDir, 'og.jpg');
  const images = new Map<string, ImageEntry>();
  let pendingImages = 0;

  app.get('/share.jpg', async (request, reply) => {
    reply.header('vary', 'User-Agent').header('cache-control', 'private, no-store');
    // UA 只决定公开海报的表示，不作为身份验证或游戏访问豁免。
    if (/^(?:slackbot-linkexpanding|slackbot|slack-imgproxy) /i.test(request.headers['user-agent'] ?? '')) {
      return reply.sendFile('og.jpg');
    }
    return reply.redirect('/');
  });

  app.get('/', async (request, reply) => {
    reply.header('cache-control', 'no-cache');
    const variant = (request.query as Record<string, unknown>).unfurl;
    if (!isPreviewVariant(variant)) return reply.sendFile('index.html');
    const html = await readFile(indexPath, 'utf8');
    return reply.type('text/html; charset=utf-8').send(renderPreviewHtml(html, variant, previewPageUrl(request.url)));
  });

  app.get('/api/oembed', async (request, reply) => {
    reply.header('cache-control', 'no-cache');
    const parsed = embedQuery.safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_request' });
    if (parsed.data.format && parsed.data.format !== 'json') return reply.status(501).send({ error: 'unsupported_format' });
    const page = supportedPreviewPage(parsed.data.url);
    if (!page) return reply.status(404).send({ error: 'not_found' });
    const metadata = previewMetadata(await readFile(indexPath, 'utf8'));
    return oEmbedRepresentation(page, metadata, parsed.data.maxwidth, parsed.data.maxheight);
  });

  app.get('/api/oembed/image', async (request, reply) => {
    const parsed = dimensions.safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_request' });
    const { width, height } = posterSize(parsed.data.maxwidth, parsed.data.maxheight);
    const key = `${width}x${height}`;
    let image = images.get(key);
    if (!image) {
      if (pendingImages >= MAX_PENDING_IMAGES) {
        return reply.header('retry-after', '1').header('cache-control', 'no-store').status(503).send({ error: 'busy' });
      }
      for (const [cachedKey, entry] of images) {
        if (images.size < MAX_CACHED_IMAGES) break;
        if (!entry.pending) images.delete(cachedKey);
      }
      pendingImages += 1;
      const entry: ImageEntry = {
        pending: true,
        promise: Promise.resolve()
          .then(() => sharp(posterPath).resize(width, height, { fit: 'fill' }).jpeg({ quality: 90 }).toBuffer())
          .then((buffer) => {
            entry.pending = false;
            pendingImages -= 1;
            return buffer;
          }, (error: unknown) => {
            pendingImages -= 1;
            images.delete(key);
            throw error;
          }),
      };
      image = entry;
      images.set(key, image);
    }
    const buffer = await image.promise;
    return reply.header('cache-control', 'public, max-age=300').type('image/jpeg').send(buffer);
  });
}
