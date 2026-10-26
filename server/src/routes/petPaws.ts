import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { changePetPaw, loadPawBook, loadPawNotices, PawError, readPetPaws, replyPetPaw } from '../services/petPaws.ts';

const Identity = z.string().trim().min(1).max(200);
const Id = z.string().regex(/^[1-9]\d{0,17}$/);
const Version = z.number().int().nonnegative().max(2147483646);
const Limit = z.number().int().min(20).max(1000).default(20);
export const petPawRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool }) => {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof PawError) return reply.status(error.status).send({ error: error.status === 404 ? 'not_found' : error.status === 409 ? 'conflict' : 'invalid_request' });
    throw error;
  });
  app.get<{ Params: { id: string } }>('/api/pets/:id/paws', async (req, reply) => {
    const q = z.object({ playerId: Identity, cursor: Id.optional() }).strict().safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    return loadPawBook(pool, req.params.id, q.data.playerId, q.data.cursor ?? null);
  });
  app.put<{ Params: { id: string } }>('/api/pets/:id/paws', async (req, reply) => {
    const body = z.object({ playerId: Identity, message: z.enum(['cute','pets','play','love']).nullable(), version: Version, limit: Limit }).strict().safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    return changePetPaw(pool, req.params.id, body.data.playerId, body.data.message, body.data.version, body.data.limit);
  });
  app.post<{ Params: { id: string; pawId: string } }>('/api/pets/:id/paws/:pawId/reply', async (req, reply) => {
    const body = z.object({ playerId: Identity, version: Version, limit: Limit }).strict().safeParse(req.body);
    if (!body.success || !Id.safeParse(req.params.pawId).success) return reply.status(400).send({ error: 'invalid_request' });
    return replyPetPaw(pool, req.params.id, body.data.playerId, req.params.pawId, body.data.version, body.data.limit);
  });
  app.post<{ Params: { id: string } }>('/api/pets/:id/paws/read', async (req, reply) => {
    const body = z.object({ playerId: Identity, kind: z.enum(['message','reply']), ids: z.array(Id).min(1).max(100) }).strict().safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    return readPetPaws(pool, req.params.id, body.data.playerId, body.data.ids, body.data.kind);
  });
  app.get<{ Params: { id: string } }>('/api/players/:id/paw-notices', req => loadPawNotices(pool, req.params.id));
};
