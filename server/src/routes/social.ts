import multipart from '@fastify/multipart';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { sessionPlayer } from '../services/auth.ts';
import { sessionToken } from '../services/requirePlayer.ts';
import { getPost, listComments, listNotices, listPosts, unreadCount, socialPerson } from '../social/read.ts';
import {
  createComment,
  changeReaction,
  publishNative,
  readNotices,
  removeComment,
  removeSocialPost,
  reportPost,
} from '../social/write.ts';
import { SOCIAL_MAX_BYTES, stagePhoto, visibleMedia } from '../social/media.ts';
import { SocialError } from '../social/types.ts';
import { REACTION_KINDS } from '../../../web/src/social/model.ts';

const idSchema = z.string().uuid();
const text = (max: number) => z.string().trim().max(max);
const postInput = z
  .object({
    id: idSchema,
    body: text(2000),
    photoIds: z.array(idSchema).max(9),
    petId: z.string().min(1).max(120).nullish(),
  })
  .strict();
const commentInput = z
  .object({ id: idSchema, body: text(500).min(1), replyToUserId: z.string().min(1).max(100).nullish() })
  .strict();
const pageInput = z
  .object({
    scope: z.enum(['all', 'mine']).default('all'),
    source: z.enum(['native', 'slack']).optional(),
    cursor: z.string().max(400).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();
const cursorInput = z.object({ cursor: z.string().max(400).optional() }).strict();

export const socialRoutes: FastifyPluginAsync<AppDeps> = async (
  app,
  { pool, social, images, now = () => new Date() },
) => {
  app.get('/api/social/config', async () => ({ enabled: !!social }));
  if (!social) return;
  const user = async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('cache-control', 'private, no-store');
    const actor = await sessionPlayer(pool, sessionToken(request));
    if (!actor) {
      reply.status(401).send({ error: 'login_required' });
      return null;
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.origin;
      const own = `${request.protocol}://${request.headers.host}`;
      if (
        request.headers['sec-fetch-site'] === 'cross-site' ||
        (origin && origin !== social.publicOrigin && origin !== own)
      ) {
        reply.status(403).send({ error: 'invalid_origin' });
        return null;
      }
    }
    return actor;
  };
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof SocialError) return reply.status(error.status).send({ error: error.code });
    if (error instanceof z.ZodError) return reply.status(400).send({ error: 'invalid_request' });
    if (['FST_REQ_FILE_TOO_LARGE', 'FST_FILES_LIMIT', 'FST_PARTS_LIMIT', 'FST_FIELDS_LIMIT'].includes(error.code ?? ''))
      return reply.status(413).send({ error: 'too_large' });
    request.log.error({ err: error }, 'social request failed');
    return reply.status(503).send({ error: 'unavailable' });
  });
  app.get('/api/social/session', async (request, reply) => {
    const id = await user(request, reply);
    if (!id) return;
    const [person, pets, count] = await Promise.all([
      pool.query('SELECT name FROM pet_match.colleagues WHERE user_id=$1', [id]),
      pool.query(
        "SELECT pet_id,name FROM pet_match.pets WHERE owner_user_id=$1 AND status='published' ORDER BY name,pet_id",
        [id],
      ),
      unreadCount(pool, id),
    ]);
    if (!person.rows[0]) return reply.status(401).send({ error: 'login_required' });
    return {
      viewer: socialPerson(id, person.rows[0].name),
      pets: pets.rows.map((p) => ({
        id: p.pet_id,
        name: p.name,
        stickerSrc: `/img/stickers/${encodeURIComponent(p.pet_id)}?size=128`,
      })),
      canModerate: social.adminIds.includes(id),
      unreadCount: count,
    };
  });
  app.get('/api/social/posts', async (request, reply) => {
    const id = await user(request, reply);
    if (id) return listPosts(pool, id, pageInput.parse(request.query));
  });
  app.get<{ Params: { id: string } }>('/api/social/posts/:id', async (request, reply) => {
    const actor = await user(request, reply);
    if (actor) return getPost(pool, idSchema.parse(request.params.id), actor);
  });
  app.post('/api/social/posts', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    const input = postInput.parse(request.body);
    await publishNative(pool, actor, input, now());
    return getPost(pool, input.id, actor);
  });
  app.delete<{ Params: { id: string } }>('/api/social/posts/:id', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    await removeSocialPost(pool, idSchema.parse(request.params.id), actor, social.adminIds.includes(actor));
    return { ok: true, unreadCount: await unreadCount(pool, actor) };
  });
  app.put<{ Params: { id: string; kind: string } }>('/api/social/posts/:id/reactions/:kind', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    const id = idSchema.parse(request.params.id),
      kind = z.enum(REACTION_KINDS).parse(request.params.kind);
    await changeReaction(
      pool,
      id,
      actor,
      kind,
      z.object({ selected: z.boolean() }).strict().parse(request.body).selected,
    );
    return getPost(pool, id, actor);
  });
  app.get<{ Params: { id: string } }>('/api/social/posts/:id/comments', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    const id = idSchema.parse(request.params.id);
    await getPost(pool, id, actor);
    return listComments(pool, id, cursorInput.parse(request.query).cursor);
  });
  app.post<{ Params: { id: string } }>('/api/social/posts/:id/comments', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    const id = idSchema.parse(request.params.id);
    await createComment(pool, id, actor, commentInput.parse(request.body), now());
    return getPost(pool, id, actor);
  });
  app.delete<{ Params: { id: string; commentId: string } }>(
    '/api/social/posts/:id/comments/:commentId',
    async (request, reply) => {
      const actor = await user(request, reply);
      if (!actor) return;
      const id = idSchema.parse(request.params.id);
      await removeComment(pool, id, idSchema.parse(request.params.commentId), actor, social.adminIds.includes(actor));
      return getPost(pool, id, actor);
    },
  );
  app.get('/api/social/notices', async (request, reply) => {
    const actor = await user(request, reply);
    if (actor) return listNotices(pool, actor, cursorInput.parse(request.query).cursor);
  });
  app.post('/api/social/notices/read', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    const input = z.object({ id: idSchema.optional() }).strict().parse(request.body);
    await readNotices(pool, actor, input.id);
    return { unreadCount: await unreadCount(pool, actor) };
  });
  app.post('/api/social/reports', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    await reportPost(
      pool,
      actor,
      z
        .object({ id: idSchema, postId: idSchema, body: text(500).min(1) })
        .strict()
        .parse(request.body),
    );
    return { ok: true };
  });
  app.get('/api/social/admin/status', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    if (!social.adminIds.includes(actor)) return reply.status(403).send({ error: 'forbidden' });
    const jobs = await pool.query(
      `SELECT count(*) FILTER(WHERE done_at IS NULL AND failed_at IS NULL)::int AS pending,count(*) FILTER(WHERE failed_at IS NOT NULL)::int AS failed FROM pet_match.social_slack_jobs`,
    );
    return {
      syncConfigured: !!social.sync,
      jobs: jobs.rows[0],
      poll: (await pool.query('SELECT source_key,last_poll_at,last_error FROM pet_match.social_sync_state')).rows,
    };
  });
  app.get('/api/social/admin/reports', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    if (!social.adminIds.includes(actor)) return reply.status(403).send({ error: 'forbidden' });
    const reports =
      await pool.query(`SELECT r.id,r.post_id AS "postId",r.body,r.created_at AS "createdAt",c.name AS "reporterName"
      FROM pet_match.social_reports r LEFT JOIN pet_match.colleagues c ON c.user_id=r.reporter_id ORDER BY r.created_at DESC,r.id DESC LIMIT 50`);
    return { reports: reports.rows };
  });
  app.post('/api/social/admin/retry', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    if (!social.adminIds.includes(actor)) return reply.status(403).send({ error: 'forbidden' });
    z.object({}).strict().parse(request.body);
    const result = await pool.query(
      'UPDATE pet_match.social_slack_jobs SET failed_at=NULL,available_at=now(),attempts=0,claimed_until=NULL WHERE failed_at IS NOT NULL',
    );
    return { retried: result.rowCount };
  });
  // 独立 multipart 插件，不改变宠物资料上传的文件数量限制。
  await app.register(async (mediaApp) => {
    await mediaApp.register(multipart, { limits: { fileSize: SOCIAL_MAX_BYTES, files: 1, fields: 0, parts: 1 } });
    mediaApp.post('/api/social/media', async (request, reply) => {
      const actor = await user(request, reply);
      if (!actor) return;
      if (!images?.store) throw new SocialError('unavailable', 503);
      const part = await request.file();
      if (!part) throw new SocialError('photo_required');
      const buffer = await part.toBuffer();
      if (part.file.truncated) throw new SocialError('too_large', 413);
      return stagePhoto(pool, images.store, actor, buffer);
    });
  });
  app.delete<{ Params: { id: string } }>('/api/social/media/:id', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    await pool.query(
      'UPDATE pet_match.social_media SET deleted_at=coalesce(deleted_at,now()) WHERE id=$1 AND uploader_id=$2 AND post_id IS NULL',
      [idSchema.parse(request.params.id), actor],
    );
    return { ok: true };
  });
  app.get<{ Params: { id: string } }>('/img/social/:id', async (request, reply) => {
    const actor = await user(request, reply);
    if (!actor) return;
    const key = await visibleMedia(pool, idSchema.parse(request.params.id), actor);
    if (!key) return reply.status(404).send({ error: 'not_found' });
    const object = await images?.store?.get(key);
    if (!object) return reply.status(404).send({ error: 'not_found' });
    return reply.header('x-content-type-options', 'nosniff').type('image/webp').send(object.body);
  });
};
