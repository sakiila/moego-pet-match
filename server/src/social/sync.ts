import { createHash, randomUUID } from 'node:crypto';
import { inTransaction, type Pool } from '../db/pool.ts';
import type { ObjectStore } from '../storage/objectStore.ts';
import { stagePhoto } from './media.ts';
import { redactPost } from './write.ts';
import {
  fetchSlackPhoto,
  slackRead,
  SlackReadError,
  type SlackMessage,
  type SlackFile,
  type SlackSyncConfig,
} from './slackApi.ts';
import type { SyncEvent } from './events.ts';

export const sourceKey = (config: SlackSyncConfig, ts: string) => `${config.teamId}/${config.channelId}/${ts}`;
export const SYNC_FORMAT_VERSION = 1;
const at = (ts: string) => {
  const [seconds, fraction = ''] = ts.split('.');
  return new Date(Number(BigInt(seconds) * 1000n + BigInt(fraction.padEnd(6, '0')) / 1000n));
};
const micros = (value: string) =>
  BigInt(value.split('.')[0]) * 1000000n + BigInt((value.split('.')[1] ?? '').padEnd(6, '0'));
const later = (a: string, b: string) => (micros(a) >= micros(b) ? a : b);
export async function markSourceDeleted(pool: Pool, config: SlackSyncConfig, ts: string, version: string) {
  await inTransaction(pool, async (db) => {
    const key = sourceKey(config, ts);
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
    const { rows } = await db.query(
      `INSERT INTO pet_match.social_posts(id,author_id,source,source_key,source_channel,source_ts,source_version,created_at)
      VALUES($1,'','slack',$2,$3,$4,$5,$6) ON CONFLICT(source_key) DO UPDATE SET source_version=greatest(social_posts.source_version,EXCLUDED.source_version) RETURNING id`,
      [randomUUID(), key, config.channelId, ts, version, at(ts)],
    );
    await redactPost(db, rows[0].id, 'deleted');
  });
}
export async function markFileDeleted(pool: Pool, fileId: string) {
  await inTransaction(pool, async (db) => {
    await db.query('INSERT INTO pet_match.social_deleted_files(file_id) VALUES($1) ON CONFLICT DO NOTHING', [fileId]);
    const ids = await db.query(
      'SELECT DISTINCT post_id FROM pet_match.social_media WHERE source_file_id=$1 AND post_id IS NOT NULL',
      [fileId],
    );
    await db.query('SELECT id FROM pet_match.social_posts WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
      ids.rows.map((r) => r.post_id),
    ]);
    await db.query('UPDATE pet_match.social_media SET deleted_at=coalesce(deleted_at,now()) WHERE source_file_id=$1', [
      fileId,
    ]);
  });
}
async function bodyText(pool: Pool, body: string) {
  const ids = [...new Set([...body.matchAll(/<@([A-Z0-9]+)>/g)].map((m) => m[1]))];
  const names = ids.length
    ? (await pool.query('SELECT user_id,name FROM pet_match.colleagues WHERE user_id=ANY($1::text[])', [ids])).rows
    : [];
  const emojis: Record<string, string> = {
    sparkling_heart: '💖',
    heart: '❤️',
    joy: '😂',
    smiling_face_with_3_hearts: '🥰',
    potato: '🥔',
    rolling_on_the_floor_laughing: '🤣',
    eyes: '👀',
    sweat_smile: '😅',
    face_holding_back_tears: '🥹',
    orange_heart: '🧡',
    heart_eyes: '😍',
    wave: '👋',
    dog: '🐶',
    cat: '🐱',
    paw_prints: '🐾',
  };
  const text = body
    .replace(/<@([A-Z0-9]+)>/g, (_m, id) => `@${names.find((n) => n.user_id === id)?.name ?? id}`)
    .replace(/<(https?:\/\/[^|>]+)(?:\|([^>]+))?>/g, (_m, url, label) => (label ? `${label} (${url})` : url))
    .replace(/:([a-z0-9_]+):/g, (m, name) => emojis[name] ?? m)
    .replace(/&(amp|lt|gt);/g, (_m, name) => ({ amp: '&', lt: '<', gt: '>' })[name as 'amp' | 'lt' | 'gt'])
    .trim();
  const characters = [...text];
  return characters.length > 2000 ? characters.slice(0, 1999).join('') + '…' : text;
}
export async function syncMessage(
  pool: Pool,
  store: ObjectStore,
  config: SlackSyncConfig,
  event: Extract<SyncEvent, { ts: string }>,
) {
  if (event.type === 'delete') return markSourceDeleted(pool, config, event.ts, event.version);
  const data = await slackRead(config, 'conversations.history', {
    channel: config.channelId,
    oldest: event.ts,
    latest: event.ts,
    inclusive: 'true',
    limit: '1',
  });
  const message = (data.messages as SlackMessage[] | undefined)?.find((m) => m.ts === event.ts);
  if (!message) return markSourceDeleted(pool, config, event.ts, event.version);
  if (message.bot_id || !message.user || (message.thread_ts && message.thread_ts !== message.ts)) return;
  const key = sourceKey(config, message.ts);
  const version = later(event.version, message.edited?.ts ?? message.ts);
  const hash = createHash('sha256')
    .update(
      JSON.stringify([
        SYNC_FORMAT_VERSION,
        message.text ?? '',
        (message.files ?? []).map((f) => [f.id, f.mode, f.is_deleted]),
      ]),
    )
    .digest('hex');
  const old = await inTransaction(pool, async (db) => {
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
    const { rows } = await db.query(
      `INSERT INTO pet_match.social_posts(id,author_id,source,source_key,source_channel,source_ts,created_at)
      VALUES($1,$2,'slack',$3,$4,$5,$6) ON CONFLICT(source_key) DO UPDATE SET source_checked_at=now() RETURNING *`,
      [randomUUID(), message.user, key, config.channelId, message.ts, at(message.ts)],
    );
    return rows[0];
  });
  if (old.hidden_at || old.deleted_at || micros(old.source_version) > micros(version)) return;
  const author = (await pool.query('SELECT 1 FROM pet_match.colleagues WHERE user_id=$1', [message.user])).rowCount;
  let files = (message.files ?? [])
    .filter(
      (f) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(f.mimetype ?? '') &&
        !f.is_external &&
        f.mode !== 'external' &&
        !f.is_deleted,
    )
    .slice(0, 9);
  if (event.type === 'verify') {
    const checked: SlackFile[] = [];
    for (const file of files) {
      try {
        const details = await slackRead(config, 'files.info', { file: file.id });
        const info = details.file as SlackFile;
        if (info.mode === 'tombstone' || info.is_deleted) await markFileDeleted(pool, file.id);
        else checked.push(info);
      } catch (error) {
        if (error instanceof SlackReadError && ['file_not_found', 'file_deleted'].includes(error.code))
          await markFileDeleted(pool, file.id);
        else throw error;
      }
    }
    files = checked;
  }
  const dead = files.length
    ? (
        await pool.query('SELECT file_id FROM pet_match.social_deleted_files WHERE file_id=ANY($1::text[])', [
          files.map((f) => f.id),
        ])
      ).rows.map((r) => r.file_id)
    : [];
  files = files.filter((f) => !dead.includes(f.id));
  const excluded = !author || ((message.files?.length ?? 0) > 0 && !files.length);
  if (old.source_hash === hash && !old.excluded_at && !excluded && event.type !== 'verify') {
    const unchanged = await pool.query(
      `UPDATE pet_match.social_posts SET source_version=greatest(source_version,$2),source_checked_at=now()
      WHERE id=$1 AND source_hash=$3 AND source_version<=$2 AND hidden_at IS NULL AND deleted_at IS NULL`,
      [old.id, version, hash],
    );
    if (unchanged.rowCount) return;
  }
  const body = excluded ? '' : await bodyText(pool, message.text ?? '');
  const existing = (
    await pool.query(
      'SELECT id,source_file_id FROM pet_match.social_media WHERE post_id=$1 AND ready AND deleted_at IS NULL',
      [old.id],
    )
  ).rows;
  const staged: string[] = [];
  const photos: { id: string; fileId: string }[] = [];
  try {
    if (!excluded)
      for (const file of files) {
        const previous = existing.find((m) => m.source_file_id === file.id);
        if (previous) {
          photos.push({ id: previous.id, fileId: file.id });
          continue;
        }
        try {
          const photo = await stagePhoto(pool, store, message.user, await fetchSlackPhoto(config, file), file.id);
          staged.push(photo.id);
          photos.push({ id: photo.id, fileId: file.id });
        } catch (error) {
          if (error instanceof SlackReadError && error.code === 'file_not_found') {
            // 下载层的瞬时 404 不等于文件已删除，先用 Slack 元数据确认。
            try {
              const info = await slackRead(config, 'files.info', { file: file.id });
              if (info.file?.mode === 'tombstone' || info.file?.is_deleted) {
                await markFileDeleted(pool, file.id);
                continue;
              }
            } catch (check) {
              if (check instanceof SlackReadError && ['file_not_found', 'file_deleted'].includes(check.code)) {
                await markFileDeleted(pool, file.id);
                continue;
              }
              throw check;
            }
            throw new SlackReadError('file_download_pending', 10);
          }
          throw error;
        }
      }
    let permalink = old.source_url as string | undefined;
    if (!permalink) {
      const result = await slackRead(config, 'chat.getPermalink', {
        channel: config.channelId,
        message_ts: message.ts,
      });
      permalink = result.permalink as string;
    }
    const link = new URL(permalink!);
    if (link.protocol !== 'https:' || !(link.hostname === 'slack.com' || link.hostname.endsWith('.slack.com')))
      throw new SlackReadError('invalid_permalink');
    await inTransaction(pool, async (db) => {
      const current = (await db.query('SELECT * FROM pet_match.social_posts WHERE id=$1 FOR UPDATE', [old.id])).rows[0];
      if (current.hidden_at || current.deleted_at || micros(current.source_version) > micros(version)) {
        await db.query(
          'UPDATE pet_match.social_media SET deleted_at=now() WHERE id=ANY($1::uuid[]) AND post_id IS NULL',
          [staged],
        );
        return;
      }
      const active = photos.length
        ? (
            await db.query(
              `SELECT m.id FROM pet_match.social_media m WHERE m.id=ANY($1::uuid[]) AND m.deleted_at IS NULL
        AND NOT EXISTS(SELECT 1 FROM pet_match.social_deleted_files d WHERE d.file_id=m.source_file_id) ORDER BY m.id FOR UPDATE`,
              [photos.map((p) => p.id)],
            )
          ).rows.map((r) => r.id)
        : [];
      const selected = photos.filter((p) => active.includes(p.id));
      const finalExcluded = excluded || ((message.files?.length ?? 0) > 0 && selected.length === 0);
      await db.query(
        'UPDATE pet_match.social_media SET deleted_at=now() WHERE post_id=$1 AND deleted_at IS NULL AND NOT(id=ANY($2::uuid[]))',
        [old.id, selected.map((p) => p.id)],
      );
      for (const [position, photo] of selected.entries())
        await db.query('UPDATE pet_match.social_media SET post_id=$2,position=$3 WHERE id=$1', [
          photo.id,
          old.id,
          position,
        ]);
      await db.query(
        `UPDATE pet_match.social_posts SET author_id=$2,body=$3,source_version=$4,source_hash=$5,source_url=$6,
        excluded_at=CASE WHEN $7 THEN now() ELSE NULL END,source_checked_at=now(),updated_at=now() WHERE id=$1`,
        [old.id, message.user, finalExcluded ? '' : body, version, hash, permalink, finalExcluded],
      );
    });
  } catch (error) {
    if (staged.length)
      await pool.query(
        'UPDATE pet_match.social_media SET deleted_at=now() WHERE id=ANY($1::uuid[]) AND post_id IS NULL',
        [staged],
      );
    throw error;
  }
}
