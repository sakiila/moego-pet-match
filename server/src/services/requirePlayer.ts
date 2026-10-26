import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from '../db/pool.ts';
import { SESSION_COOKIE, sessionPlayer } from './auth.ts';
import { findColleague } from './players.ts';
import { singleFlight } from './singleFlight.ts';

const checks = new WeakMap<Pool, ReturnType<typeof singleFlight<{ exists: boolean; authenticated: string | null }>>>();

export function sessionToken(request: FastifyRequest) {
  return request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}

export async function requirePlayer(request: FastifyRequest, reply: FastifyReply, pool: Pool, playerId: string) {
  let flight = checks.get(pool);
  if (!flight) {
    flight = singleFlight();
    checks.set(pool, flight);
  }
  const token = sessionToken(request);
  const { exists, authenticated } = await flight(JSON.stringify([playerId, token]), async () => ({
    exists: Boolean(await findColleague(pool, playerId)),
    authenticated: await sessionPlayer(pool, token),
  }));
  reply.header('cache-control', 'no-store');
  if (!exists) {
    reply.status(404).send({ error: 'not_found' });
    return false;
  }
  if (!authenticated) {
    reply.status(401).send({ error: 'login_required' });
    return false;
  }
  if (authenticated !== playerId) {
    reply.status(403).send({ error: 'identity_mismatch' });
    return false;
  }
  return true;
}
