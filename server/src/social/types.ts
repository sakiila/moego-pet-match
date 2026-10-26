import type { PoolClient } from 'pg';
import type { Pool } from '../db/pool.ts';
import { z } from 'zod';

export type SocialDb = Pool | PoolClient;
export interface SocialOptions {
  publicOrigin: string;
  adminIds: string[];
  startWorker?: boolean;
  sync?: { teamId: string; channelId: string; token: string; fetchImpl?: typeof fetch; requestGapMs?: number };
}
export class SocialError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
  ) {
    super(code);
  }
}
export const cursorSchema = z.tuple([z.string().datetime(), z.string().uuid()]);
export function decodeCursor(cursor?: string): [string, string] | null {
  if (!cursor) return null;
  try {
    if (cursor.length > 400) throw new Error();
    return cursorSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString()));
  } catch {
    throw new SocialError('invalid_cursor');
  }
}
export function encodeCursor(row: { created_at: Date; id: string }) {
  return Buffer.from(JSON.stringify([row.created_at.toISOString(), row.id])).toString('base64url');
}
export const visiblePost = `p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.excluded_at IS NULL AND (p.body<>'' OR EXISTS (
  SELECT 1 FROM pet_match.social_media vp_media WHERE vp_media.post_id=p.id AND vp_media.ready AND vp_media.deleted_at IS NULL))`;
export async function lockPost(db: SocialDb, id: string) {
  const { rows } = await db.query(
    `SELECT p.* FROM pet_match.social_posts p
    JOIN pet_match.colleagues c ON c.user_id=p.author_id
    WHERE p.id=$1 AND ${visiblePost} FOR UPDATE OF p`,
    [id],
  );
  if (!rows[0]) throw new SocialError('not_found', 404);
  return rows[0];
}
export const mediaUrl = (id: string) => `/img/social/${id}`;
