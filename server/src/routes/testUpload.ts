import multipart from '@fastify/multipart';
import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';
import type { AppDeps } from '../app.ts';
import { findColleague } from '../services/players.ts';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** 按文件头判断真实格式（不信任文件名与声明的类型）：JPEG、PNG、WebP、HEIC。 */
export function sniffImage(buf: Buffer): { ext: string; contentType: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', contentType: 'image/jpeg' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: 'png', contentType: 'image/png' };
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP')
    return { ext: 'webp', contentType: 'image/webp' };
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp' && /^(heic|heix|hevc|mif1|msf1)$/.test(buf.toString('ascii', 8, 12)))
    return { ext: 'heic', contentType: 'image/heic' };
  return null;
}

/**
 * 测试上传入口（仅在开启时注册）：原样保存到对象存储 test/ 前缀并记一行资料，
 * 用于验证照片接收链路。正式上传界面与限流在阶段 4 完成。
 */
export const testUploadRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, images }) => {
  if (!images?.enableTestUpload) return;
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4 } });

  app.post('/api/test/submissions', async (request, reply) => {
    const store = images.store;
    if (!store) return reply.status(503).send({ error: 'unavailable' });
    const part = await request.file();
    if (!part) return reply.status(400).send({ error: 'invalid_request' });
    const buf = await part.toBuffer().catch(() => null);
    if (!buf || part.file.truncated) return reply.status(413).send({ error: 'too_large' });
    const field = (name: string) => {
      const f = part.fields[name] as { value?: unknown } | undefined;
      return typeof f?.value === 'string' ? f.value.trim() : '';
    };
    const playerId = field('playerId');
    const petName = field('petName');
    if (!playerId || !petName) return reply.status(400).send({ error: 'invalid_request' });
    if (!(await findColleague(pool, playerId))) return reply.status(404).send({ error: 'not_found' });
    const type = sniffImage(buf);
    if (!type) return reply.status(415).send({ error: 'unsupported_type' });
    const key = `test/submissions/${randomUUID()}.${type.ext}`;
    await store.put(key, buf, type.contentType);
    const { rows } = await pool.query(
      `INSERT INTO pet_match.submissions (player_id, pet_name, object_key, content_type, size_bytes) VALUES ($1, $2, $3, $4, $5) RETURNING submission_id`,
      [playerId, petName, key, type.contentType, buf.length],
    );
    return { submissionId: rows[0].submission_id, objectKey: key, sizeBytes: buf.length };
  });
};
