import multipart from '@fastify/multipart';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app.ts';
import { findColleague } from '../services/players.ts';
import { createSubmission, isEnglishText, MAX_UPLOAD_BYTES, OWNER_QUOTE_MAX, PET_NAME_MAX, SubmissionError } from '../services/submissions.ts';

/**
 * 上传我家毛孩子：一次一只，照片原样私有保存，由 Bob 用命令行取走后人工处理上架。
 * 主人固定为当前游戏身份；「主人说」选填、只收英文。成功只表示已收到，不进入阵容。
 */
export const submissionRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, images, now = () => new Date(), submissionHooks }) => {
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4 } });

  app.post('/api/submissions', async (request, reply) => {
    const store = images?.store;
    if (!store) return reply.status(503).send({ error: 'unavailable' });
    const part = await request.file().catch(() => undefined);
    if (!part) return reply.status(400).send({ error: 'photo_required' });
    const file = await part.toBuffer().catch(() => null);
    if (!file || part.file.truncated) return reply.status(413).send({ error: 'too_large' });
    const field = (name: string) => {
      const f = part.fields[name] as { value?: unknown } | undefined;
      return typeof f?.value === 'string' ? f.value.trim() : '';
    };
    const playerId = field('playerId');
    const petName = field('petName');
    if (!playerId) return reply.status(400).send({ error: 'invalid_request' });
    if (!petName) return reply.status(400).send({ error: 'name_required' });
    if ([...petName].length > PET_NAME_MAX) return reply.status(400).send({ error: 'invalid_request', detail: 'name too long' });
    const ownerQuote = field('ownerQuote').replace(/\r\n?/g, '\n');
    if ([...ownerQuote].length > OWNER_QUOTE_MAX) return reply.status(400).send({ error: 'invalid_request', detail: 'quote too long' });
    if (!isEnglishText(ownerQuote)) return reply.status(400).send({ error: 'quote_not_english' });
    if (!(await findColleague(pool, playerId))) return reply.status(404).send({ error: 'not_found' });
    try {
      return await createSubmission(pool, store, { playerId, petName, ownerQuote: ownerQuote || null, file }, now(), submissionHooks);
    } catch (error) {
      if (error instanceof SubmissionError) return reply.status(error.code === 'daily_limit' ? 429 : 415).send({ error: error.code });
      throw error;
    }
  });
};
