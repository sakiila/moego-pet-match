import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Client, PoolClient } from 'pg';
import { inTransaction, type Pool } from '../db/pool.ts';

const deriveKey = promisify(scrypt);
export const SESSION_COOKIE = 'pet_match_session';
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
const LOCK_MS = 15 * 60 * 1000;
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function hashPin(pin: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(pin, salt, 32) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

async function verifyPin(pin: string, hash: string) {
  const [salt, stored] = hash.split(':');
  const key = await deriveKey(pin, salt, 32) as Buffer;
  const expected = Buffer.from(stored, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export async function createSession(db: Pool | PoolClient, playerId: string) {
  const token = randomBytes(32).toString('hex');
  await db.query(`INSERT INTO pet_match.player_sessions(token_hash,player_id,expires_at)
    VALUES($1,$2,now() + $3 * interval '1 second')`, [tokenHash(token), playerId, SESSION_SECONDS]);
  return token;
}

export type SignInResult = { token: string } | { error: 'pin_required' | 'pin_exists' | 'wrong_pin' | 'locked'; retryAfter?: number };

/** 行锁同时保护首次认领、错误计数和锁定，跨进程并发也不能覆盖密码或多试五次。 */
export function signIn(pool: Pool, playerId: string, pin: string, setup: boolean): Promise<SignInResult> {
  return inTransaction(pool, async client => {
    await client.query('INSERT INTO pet_match.player_credentials(player_id) VALUES($1) ON CONFLICT DO NOTHING', [playerId]);
    const { rows: [credential] } = await client.query('SELECT * FROM pet_match.player_credentials WHERE player_id=$1 FOR UPDATE', [playerId]);
    const now = Date.now();
    if (credential.locked_until && credential.locked_until.getTime() > now) {
      return { error: 'locked', retryAfter: Math.ceil((credential.locked_until.getTime() - now) / 1000) };
    }
    if (setup && credential.pin_hash) return { error: 'pin_exists' };
    if (!setup && !credential.pin_hash) return { error: 'pin_required' };
    if (credential.pin_hash && !await verifyPin(pin, credential.pin_hash)) {
      const failures = credential.locked_until ? 1 : credential.failed_attempts + 1;
      const lockedUntil = failures >= 5 ? new Date(now + LOCK_MS) : null;
      await client.query('UPDATE pet_match.player_credentials SET failed_attempts=$2,locked_until=$3 WHERE player_id=$1', [playerId, failures, lockedUntil]);
      return lockedUntil ? { error: 'locked', retryAfter: LOCK_MS / 1000 } : { error: 'wrong_pin' };
    }
    await client.query(`UPDATE pet_match.player_credentials SET pin_hash=$2,failed_attempts=0,locked_until=NULL,updated_at=now() WHERE player_id=$1`,
      [playerId, credential.pin_hash ?? await hashPin(pin)]);
    return { token: await createSession(client, playerId) };
  });
}

export async function sessionPlayer(pool: Pool, token: string | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { rows } = await pool.query(`SELECT s.player_id FROM pet_match.player_sessions s
    JOIN pet_match.colleagues c ON c.user_id=s.player_id
    WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()`, [tokenHash(token)]);
  return rows[0]?.player_id as string | undefined ?? null;
}

export async function revokeSession(pool: Pool, token: string | undefined) {
  if (token) await pool.query('UPDATE pet_match.player_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL', [tokenHash(token)]);
}

/** 人工核实后清除密码并撤销全部设备凭证；不触碰成绩或图鉴。 */
export async function resetPin(client: PoolClient | Client, playerId: string) {
  await client.query('SELECT player_id FROM pet_match.player_credentials WHERE player_id=$1 FOR UPDATE', [playerId]);
  await client.query('UPDATE pet_match.player_credentials SET pin_hash=NULL,failed_attempts=0,locked_until=NULL,updated_at=now() WHERE player_id=$1', [playerId]);
  await client.query('UPDATE pet_match.player_sessions SET revoked_at=now() WHERE player_id=$1 AND revoked_at IS NULL', [playerId]);
}
