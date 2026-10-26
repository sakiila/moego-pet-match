import { createHash } from 'node:crypto';
import { inTransaction, type Pool } from '../db/pool.ts';
import { lockPost, SocialError, type SocialDb } from './types.ts';

export interface NativePostInput {
  id: string;
  body: string;
  photoIds: string[];
  petId?: string | null;
}
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function publishNative(pool: Pool, authorId: string, input: NativePostInput, at = new Date()) {
  const body = input.body.trim();
  if (
    (!body && !input.photoIds.length) ||
    input.photoIds.length > 9 ||
    new Set(input.photoIds).size !== input.photoIds.length
  )
    throw new SocialError('invalid_post');
  const payloadHash = hash([body, input.photoIds, input.petId ?? null]);
  await inTransaction(pool, async (db) => {
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`social-publish:${input.id}`]);
    const old = await db.query('SELECT author_id,payload_hash,deleted_at FROM pet_match.social_posts WHERE id=$1', [
      input.id,
    ]);
    if (old.rows[0]) {
      if (old.rows[0].author_id !== authorId || old.rows[0].payload_hash !== payloadHash || old.rows[0].deleted_at)
        throw new SocialError('publish_conflict', 409);
      return;
    }
    if (
      input.petId &&
      !(
        await db.query("SELECT 1 FROM pet_match.pets WHERE pet_id=$1 AND owner_user_id=$2 AND status='published'", [
          input.petId,
          authorId,
        ])
      ).rowCount
    )
      throw new SocialError('invalid_pet');
    const media = await db.query(
      `SELECT * FROM pet_match.social_media WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE`,
      [input.photoIds],
    );
    if (
      media.rows.length !== input.photoIds.length ||
      media.rows.some(
        (m) =>
          m.uploader_id !== authorId ||
          m.post_id ||
          !m.ready ||
          m.deleted_at ||
          m.created_at.getTime() < at.getTime() - 86400000,
      )
    )
      throw new SocialError('media_unavailable', 409);
    await db.query(
      `INSERT INTO pet_match.social_posts(id,author_id,body,pet_id,source,payload_hash,created_at,updated_at)
      VALUES($1,$2,$3,$4,'native',$5,$6,$6)`,
      [input.id, authorId, body, input.petId ?? null, payloadHash, at],
    );
    for (const [position, id] of input.photoIds.entries())
      await db.query('UPDATE pet_match.social_media SET post_id=$2,position=$3 WHERE id=$1', [id, input.id, position]);
  });
  return input.id;
}

async function addNotice(
  db: SocialDb,
  input: {
    key: string;
    postId: string;
    actorId: string;
    recipientId: string;
    kind: string;
    commentId?: string;
    excerpt?: string;
  },
) {
  if (input.actorId === input.recipientId) return;
  await db.query(
    `INSERT INTO pet_match.social_notices(event_key,post_id,actor_id,recipient_id,kind,comment_id,excerpt)
    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(event_key) DO UPDATE SET deleted_at=NULL,read_at=NULL,created_at=now(),excerpt=EXCLUDED.excerpt`,
    [
      input.key,
      input.postId,
      input.actorId,
      input.recipientId,
      input.kind,
      input.commentId ?? null,
      input.excerpt ?? null,
    ],
  );
}

export async function changeReaction(pool: Pool, postId: string, actorId: string, kind: string, selected: boolean) {
  await inTransaction(pool, async (db) => {
    const post = await lockPost(db, postId);
    const old = await db.query(
      'SELECT active FROM pet_match.social_reactions WHERE post_id=$1 AND player_id=$2 AND kind=$3',
      [postId, actorId, kind],
    );
    if (Boolean(old.rows[0]?.active) === selected) return;
    await db.query(
      `INSERT INTO pet_match.social_reactions(post_id,player_id,kind,active) VALUES($1,$2,$3,$4)
      ON CONFLICT(post_id,player_id,kind) DO UPDATE SET active=EXCLUDED.active`,
      [postId, actorId, kind, selected],
    );
    const key = `r:${postId}:${actorId}:${kind}`;
    if (selected) await addNotice(db, { key, postId, actorId, recipientId: post.author_id, kind });
    else await db.query('UPDATE pet_match.social_notices SET deleted_at=now(),excerpt=NULL WHERE event_key=$1', [key]);
  });
}

export async function createComment(
  pool: Pool,
  postId: string,
  actorId: string,
  input: { id: string; body: string; replyToUserId?: string | null },
  at = new Date(),
) {
  await inTransaction(pool, async (db) => {
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`social-comment:${input.id}`]);
    const post = await lockPost(db, postId);
    const old = await db.query('SELECT * FROM pet_match.social_comments WHERE id=$1', [input.id]);
    const body = input.body.trim();
    if (old.rows[0]) {
      const c = old.rows[0];
      if (
        c.post_id !== postId ||
        c.author_id !== actorId ||
        c.body !== body ||
        c.deleted_at ||
        c.reply_to_user_id !== (input.replyToUserId ?? null)
      )
        throw new SocialError('comment_conflict', 409);
      return;
    }
    if (input.replyToUserId) {
      const target = await db.query(
        `SELECT 1 FROM pet_match.colleagues a WHERE a.user_id=$1 AND
        (a.user_id=$2 OR EXISTS(SELECT 1 FROM pet_match.social_comments WHERE post_id=$3 AND author_id=a.user_id AND deleted_at IS NULL))`,
        [input.replyToUserId, post.author_id, postId],
      );
      if (!target.rowCount) throw new SocialError('invalid_reply');
    }
    await db.query(
      'INSERT INTO pet_match.social_comments(id,post_id,author_id,body,reply_to_user_id,created_at) VALUES($1,$2,$3,$4,$5,$6)',
      [input.id, postId, actorId, body, input.replyToUserId ?? null, at],
    );
    for (const recipientId of new Set([post.author_id, input.replyToUserId].filter(Boolean)))
      await addNotice(db, {
        key: `c:${input.id}:${recipientId}`,
        postId,
        actorId,
        recipientId,
        kind: 'comment',
        commentId: input.id,
        excerpt: body.slice(0, 160),
      });
  });
}

export async function removeComment(pool: Pool, postId: string, commentId: string, actorId: string, admin: boolean) {
  await inTransaction(pool, async (db) => {
    await lockPost(db, postId);
    const { rows } = await db.query(
      'SELECT author_id,source FROM pet_match.social_comments WHERE id=$1 AND post_id=$2 FOR UPDATE',
      [commentId, postId],
    );
    if (!rows[0]) throw new SocialError('not_found', 404);
    // Slack 回复由原线程管理，本站不能删除。
    if (rows[0].source === 'slack') throw new SocialError('forbidden', 403);
    if (rows[0].author_id !== actorId && !admin) throw new SocialError('forbidden', 403);
    await db.query("UPDATE pet_match.social_comments SET body='',deleted_at=coalesce(deleted_at,now()) WHERE id=$1", [
      commentId,
    ]);
    await db.query('UPDATE pet_match.social_notices SET excerpt=NULL,deleted_at=now() WHERE comment_id=$1', [
      commentId,
    ]);
  });
}

/** 先撤销可见性和媒体访问，再由持久的媒体标记驱动对象清理。 */
export async function redactPost(db: SocialDb, id: string, mode: 'hidden' | 'deleted') {
  await db.query(
    `UPDATE pet_match.social_posts SET body='',pet_id=NULL,updated_at=now(),${mode === 'hidden' ? 'hidden_at' : 'deleted_at'}=coalesce(${mode === 'hidden' ? 'hidden_at' : 'deleted_at'},now()) WHERE id=$1`,
    [id],
  );
  await db.query('UPDATE pet_match.social_media SET deleted_at=coalesce(deleted_at,now()) WHERE post_id=$1', [id]);
  await db.query(
    "UPDATE pet_match.social_comments SET body='',deleted_at=coalesce(deleted_at,now()) WHERE post_id=$1",
    [id],
  );
  await db.query('UPDATE pet_match.social_reactions SET active=false WHERE post_id=$1', [id]);
  await db.query('UPDATE pet_match.social_notices SET excerpt=NULL,deleted_at=now() WHERE post_id=$1', [id]);
}
export async function removeSocialPost(pool: Pool, id: string, actorId: string, admin: boolean) {
  await inTransaction(pool, async (db) => {
    const { rows } = await db.query('SELECT * FROM pet_match.social_posts WHERE id=$1 FOR UPDATE', [id]);
    if (!rows[0]) throw new SocialError('not_found', 404);
    if (rows[0].author_id !== actorId && !admin) throw new SocialError('forbidden', 403);
    await redactPost(db, id, rows[0].source === 'slack' ? 'hidden' : 'deleted');
  });
}
export async function readNotices(db: SocialDb, recipientId: string, id?: string) {
  await db.query(
    'UPDATE pet_match.social_notices SET read_at=coalesce(read_at,now()) WHERE recipient_id=$1 AND ($2::uuid IS NULL OR id=$2)',
    [recipientId, id ?? null],
  );
}
export async function reportPost(pool: Pool, actorId: string, input: { id: string; postId: string; body: string }) {
  await inTransaction(pool, async (db) => {
    await lockPost(db, input.postId);
    await db.query(
      'INSERT INTO pet_match.social_reports(id,post_id,reporter_id,body) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',
      [input.id, input.postId, actorId, input.body.trim()],
    );
  });
}
