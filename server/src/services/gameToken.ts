import { createHash, timingSafeEqual } from 'node:crypto';

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function sameToken(hash: unknown, token: string | undefined): boolean {
  if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash) || !token) return false;
  return timingSafeEqual(Buffer.from(tokenHash(token)), Buffer.from(hash));
}
