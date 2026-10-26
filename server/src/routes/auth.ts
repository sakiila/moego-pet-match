import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';
import { findColleague, registerFromSlack } from '../services/players.ts';
import { revokeSession, SESSION_COOKIE, SESSION_SECONDS, signIn } from '../services/auth.ts';
import { sessionToken } from '../services/requirePlayer.ts';

function setCookie(reply: FastifyReply, token: string, seconds: number) {
  reply.header('set-cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}
const Body = z.object({ playerId: z.string().trim().min(1).max(100), pin: z.string().regex(/^[0-9]{4}$/), confirmation: z.string().optional() }).strict();

export const authRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, directory }) => {
  app.addHook('onRequest', async (_request, reply) => { reply.header('cache-control', 'no-store'); });
  app.get<{ Params: { id: string } }>('/api/auth/players/:id', async (request, reply) => {
    let player = await findColleague(pool, request.params.id);
    if (!player && directory && await registerFromSlack(pool, directory, request.params.id)) player = await findColleague(pool, request.params.id);
    if (!player) return reply.status(404).send({ error: 'not_found' });
    const { rows } = await pool.query('SELECT pin_hash IS NOT NULL AS has_pin FROM pet_match.player_credentials WHERE player_id=$1', [player.userId]);
    return { ...player, hasPin: rows[0]?.has_pin ?? false };
  });

  for (const setup of [true, false]) {
    app.post(`/api/auth/${setup ? 'setup' : 'login'}`, async (request, reply) => {
      const body = Body.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ error: 'invalid_pin' });
      if (setup && body.data.confirmation !== body.data.pin) return reply.status(400).send({ error: 'pin_mismatch' });
      if (!await findColleague(pool, body.data.playerId)) return reply.status(404).send({ error: 'not_found' });
      const result = await signIn(pool, body.data.playerId, body.data.pin, setup);
      reply.header('cache-control', 'no-store');
      if ('error' in result) {
        if (result.retryAfter) reply.header('retry-after', result.retryAfter);
        return reply.status(result.error === 'locked' ? 429 : result.error === 'wrong_pin' ? 401 : 409).send(result);
      }
      await revokeSession(pool, sessionToken(request));
      setCookie(reply, result.token, SESSION_SECONDS);
      return { userId: body.data.playerId };
    });
  }

  app.post('/api/auth/logout', async (request, reply) => {
    await revokeSession(pool, sessionToken(request));
    setCookie(reply, '', 0);
    return { ok: true };
  });
};
