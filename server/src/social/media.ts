import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { Pool } from '../db/pool.ts';
import type { ObjectStore } from '../storage/objectStore.ts';
import { SocialError, mediaUrl, visiblePost } from './types.ts';

export const SOCIAL_MAX_BYTES = 12 * 1024 * 1024;
function supported(buffer: Buffer) {
  return (
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) ||
    (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP')
  );
}
export async function stagePhoto(
  pool: Pool,
  store: ObjectStore,
  uploaderId: string,
  input: Buffer,
  sourceFileId?: string,
) {
  if (input.length > SOCIAL_MAX_BYTES) throw new SocialError('too_large', 413);
  if (!supported(input)) throw new SocialError('unsupported_photo', 415);
  let processed: sharp.OutputInfo;
  let body: Buffer;
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000, animated: false });
    const metadata = await image.metadata();
    if ((metadata.pages ?? 1) > 1) throw new Error('animated');
    const result = await image
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });
    body = result.data;
    processed = result.info;
  } catch {
    throw new SocialError('unsupported_photo', 415);
  }
  const id = randomUUID();
  const key = `social/${id}/${createHash('sha256').update(body).digest('hex')}.webp`;
  await pool.query(
    'INSERT INTO pet_match.social_media(id,uploader_id,object_key,width,height,bytes,source_file_id) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [id, uploaderId, key, processed.width, processed.height, body.length, sourceFileId ?? null],
  );
  try {
    await store.put(key, body, 'image/webp');
    await pool.query('UPDATE pet_match.social_media SET ready=true WHERE id=$1', [id]);
  } catch (error) {
    await pool.query('UPDATE pet_match.social_media SET deleted_at=now() WHERE id=$1', [id]);
    throw error;
  }
  return { id, src: mediaUrl(id), alt: '' };
}
export async function visibleMedia(pool: Pool, id: string, viewerId: string) {
  const { rows } = await pool.query(
    `SELECT m.object_key FROM pet_match.social_media m LEFT JOIN pet_match.social_posts p ON p.id=m.post_id
    WHERE m.id=$1 AND m.ready AND m.deleted_at IS NULL AND
    ((m.post_id IS NULL AND m.uploader_id=$2 AND m.created_at>now()-interval '24 hours') OR
     (m.post_id IS NOT NULL AND ${visiblePost} AND EXISTS(SELECT 1 FROM pet_match.colleagues WHERE user_id=p.author_id)))`,
    [id, viewerId],
  );
  return rows[0]?.object_key as string | undefined;
}
export async function purgeSocialMedia(pool: Pool, store: ObjectStore, limit = 20) {
  const { rows } = await pool.query(
    `WITH candidates AS (SELECT id FROM pet_match.social_media WHERE purged_at IS NULL
    AND (deleted_at IS NOT NULL OR (post_id IS NULL AND created_at<now()-interval '24 hours'))
    AND (purge_claimed_until IS NULL OR purge_claimed_until<now()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $1)
    UPDATE pet_match.social_media m SET deleted_at=coalesce(m.deleted_at,now()),purge_claimed_until=now()+interval '1 minute'
    FROM candidates c WHERE m.id=c.id RETURNING m.id,m.object_key`,
    [limit],
  );
  let purged = 0;
  for (const row of rows) {
    try {
      await store.delete(row.object_key);
      await pool.query('UPDATE pet_match.social_media SET purged_at=now(),purge_claimed_until=NULL WHERE id=$1', [
        row.id,
      ]);
      purged++;
    } catch {
      await pool.query("UPDATE pet_match.social_media SET purge_claimed_until=now()+interval '1 minute' WHERE id=$1", [
        row.id,
      ]);
    }
  }
  return purged;
}
