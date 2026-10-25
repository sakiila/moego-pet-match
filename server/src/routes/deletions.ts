import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { createDeletionRequest, DELETION_NOTE_MAX, DeletionError, listDeletionRequests, listMyPets } from '../services/deletions.ts';
import { findColleague } from '../services/players.ts';

const PlayerQuery = z.object({ playerId: z.string().min(1) });
const RequestBody = z.object({
  playerId: z.string().min(1),
  petId: z.string().min(1).nullish(),
  note: z.string().max(DELETION_NOTE_MAX * 2).nullish(),
});

/** 我的宠物与资料删除申请。申请只记为待处理，由 Bob 用 deletions.ts 人工核实、下架清理后标记已处理。 */
export const deletionRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, notify }) => {
  app.get('/api/my-pets', async (request, reply) => {
    const q = PlayerQuery.safeParse(request.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!(await findColleague(pool, q.data.playerId))) return reply.status(404).send({ error: 'not_found' });
    return { pets: await listMyPets(pool, q.data.playerId) };
  });

  app.get('/api/deletion-requests', async (request, reply) => {
    const q = PlayerQuery.safeParse(request.query);
    if (!q.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!(await findColleague(pool, q.data.playerId))) return reply.status(404).send({ error: 'not_found' });
    return { requests: await listDeletionRequests(pool, q.data.playerId) };
  });

  app.post('/api/deletion-requests', async (request, reply) => {
    const body = RequestBody.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_request' });
    const note = body.data.note?.trim() || null;
    if (note && [...note].length > DELETION_NOTE_MAX) return reply.status(400).send({ error: 'invalid_request', detail: 'note too long' });
    const colleague = await findColleague(pool, body.data.playerId);
    if (!colleague) return reply.status(404).send({ error: 'not_found' });
    try {
      const petId = body.data.petId ?? null;
      const { created, ...result } = await createDeletionRequest(pool, { playerId: body.data.playerId, petId, note });
      // 只通知新建的申请；同一只宠物重复提交返回原申请，不再打扰
      if (created && notify) {
        const at = new Date();
        void (async () => {
          const petName = petId ? ((await pool.query('SELECT name FROM pet_match.pets WHERE pet_id = $1', [petId])).rows[0]?.name ?? null) : null;
          await notify({ kind: 'deletion', requestId: result.requestId, playerId: colleague.userId, playerName: colleague.name, petId, petName, note, at });
        })().catch((error) => request.log.warn({ err: error }, 'deletion notify failed'));
      }
      return result;
    } catch (error) {
      if (error instanceof DeletionError) return reply.status(error.code === 'forbidden' ? 403 : 404).send({ error: error.code });
      throw error;
    }
  });
};
