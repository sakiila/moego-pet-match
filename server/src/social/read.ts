import type { AchievementId } from '../../../web/src/game/achievementRules.ts';
import { REACTION_KINDS, type SocialPost, type SocialComment, type SocialNotice, type ReactionKind } from '../../../web/src/social/model.ts';
import { decodeCursor, encodeCursor, mediaUrl, visiblePost, type SocialDb, SocialError } from './types.ts';

/** title 为当前佩戴的称号徽章，没有佩戴时省略。 */
export const socialPerson = (id: string, name: string, title?: AchievementId | null) => ({
  id,
  name,
  avatarSrc: /^[UW][A-Z0-9]{8,}$/.test(id) ? `/img/avatars/${encodeURIComponent(id)}` : undefined,
  ...(title ? { title } : {}),
});
const titleJoin = (alias: string, column: string) =>
  `LEFT JOIN pet_match.player_titles ${alias} ON ${alias}.player_id=${column}`;
const person = socialPerson;
const base = `SELECT p.*,c.name,pt.equipped_title AS author_title,pet.name AS pet_name FROM pet_match.social_posts p
  JOIN pet_match.colleagues c ON c.user_id=p.author_id ${titleJoin('pt', 'p.author_id')}
  LEFT JOIN pet_match.pets pet ON pet.pet_id=p.pet_id AND pet.status='published'`;

export async function postViews(db: SocialDb, rows: Record<string, any>[], viewerId: string): Promise<SocialPost[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [media, reactions, counts] = await Promise.all([
    db.query(
      `SELECT id,post_id,position FROM pet_match.social_media WHERE post_id=ANY($1::uuid[]) AND ready AND deleted_at IS NULL ORDER BY position,id`,
      [ids],
    ),
    db.query(
      `SELECT r.post_id,r.kind,count(*)::int AS count,bool_or(r.player_id=$2) AS selected FROM pet_match.social_reactions r
      JOIN pet_match.colleagues c ON c.user_id=r.player_id WHERE r.post_id=ANY($1::uuid[]) AND r.active GROUP BY r.post_id,r.kind`,
      [ids, viewerId],
    ),
    db.query(
      `SELECT c.post_id,count(*)::int AS count FROM pet_match.social_comments c JOIN pet_match.colleagues a ON a.user_id=c.author_id
      WHERE c.post_id=ANY($1::uuid[]) AND c.deleted_at IS NULL GROUP BY c.post_id`,
      [ids],
    ),
  ]);
  return rows.map((row) => {
    const summary = Object.fromEntries(
      REACTION_KINDS.map((kind) => [
        kind,
        reactions.rows.find((r) => r.post_id === row.id && r.kind === kind),
      ]),
    );
    return {
      id: row.id,
      author: person(row.author_id, row.name, row.author_title),
      body: row.body,
      source: row.source,
      sourceUrl: row.source_url ?? undefined,
      createdAt: row.created_at.toISOString(),
      photos: media.rows
        .filter((m) => m.post_id === row.id)
        .map((m, i) => ({ id: m.id, src: mediaUrl(m.id), alt: `${row.name} · ${i + 1}` })),
      pet: row.pet_name
        ? { id: row.pet_id, name: row.pet_name, stickerSrc: `/img/pets/${encodeURIComponent(row.pet_id)}/128` }
        : undefined,
      reactions: Object.fromEntries(
        REACTION_KINDS.map((kind) => [kind, summary[kind]?.selected ? [viewerId] : []]),
      ) as Record<ReactionKind, string[]>,
      reactionCounts: Object.fromEntries(
        REACTION_KINDS.map((kind) => [kind, summary[kind]?.count ?? 0]),
      ) as Record<ReactionKind, number>,
      comments: [],
      commentCount: counts.rows.find((c) => c.post_id === row.id)?.count ?? 0,
    };
  });
}

export async function listPosts(
  db: SocialDb,
  viewerId: string,
  options: { scope?: string; source?: string; cursor?: string; limit?: number } = {},
) {
  const cursor = decodeCursor(options.cursor);
  const limit = Math.min(options.limit ?? 20, 50);
  const { rows } = await db.query(
    `${base} WHERE ${visiblePost}
    AND ($1::text IS NULL OR p.author_id=$1) AND ($2::text IS NULL OR p.source=$2)
    AND ($3::timestamptz IS NULL OR (p.created_at,p.id)<($3::timestamptz,$4::uuid))
    ORDER BY p.created_at DESC,p.id DESC LIMIT $5`,
    [
      options.scope === 'mine' ? viewerId : null,
      options.scope === 'mine' ? (options.source ?? null) : null,
      cursor?.[0] ?? null,
      cursor?.[1] ?? null,
      limit + 1,
    ],
  );
  const page = rows.slice(0, limit);
  return {
    posts: await postViews(db, page, viewerId),
    nextCursor: rows.length > limit ? encodeCursor(page.at(-1)) : null,
  };
}

export async function listComments(db: SocialDb, postId: string, cursor?: string) {
  const decoded = decodeCursor(cursor);
  const { rows } = await db.query(
    `SELECT c.*,a.name,ct.equipped_title AS author_title,rc.name AS reply_name FROM pet_match.social_comments c
    JOIN pet_match.colleagues a ON a.user_id=c.author_id ${titleJoin('ct', 'c.author_id')} LEFT JOIN pet_match.colleagues rc ON rc.user_id=c.reply_to_user_id
    WHERE c.post_id=$1 AND c.deleted_at IS NULL AND ($2::timestamptz IS NULL OR (c.created_at,c.id)<($2::timestamptz,$3::uuid))
    ORDER BY c.created_at DESC,c.id DESC LIMIT 51`,
    [postId, decoded?.[0] ?? null, decoded?.[1] ?? null],
  );
  const page = rows.slice(0, 50);
  const comments: SocialComment[] = page
    .map((r) => ({
      id: r.id,
      author: person(r.author_id, r.name, r.author_title),
      body: r.body,
      createdAt: r.created_at.toISOString(),
      ...(r.source === 'slack' ? { source: 'slack' as const } : {}),
      replyTo: r.reply_name ? person(r.reply_to_user_id, r.reply_name) : undefined,
    }))
    .reverse();
  return { comments, nextCursor: rows.length > 50 ? encodeCursor(page.at(-1)) : null };
}

export async function getPost(db: SocialDb, id: string, viewerId: string): Promise<SocialPost> {
  const { rows } = await db.query(`${base} WHERE p.id=$1 AND ${visiblePost}`, [id]);
  if (!rows.length) throw new SocialError('not_found', 404);
  const [posts, comments] = await Promise.all([postViews(db, rows, viewerId), listComments(db, id)]);
  return { ...posts[0], comments: comments.comments, commentsCursor: comments.nextCursor };
}

const noticeVisible = `n.recipient_id=$1 AND n.deleted_at IS NULL AND ${visiblePost}`;
const noticeJoins = `FROM pet_match.social_notices n JOIN pet_match.social_posts p ON p.id=n.post_id
  JOIN pet_match.colleagues owner ON owner.user_id=p.author_id JOIN pet_match.colleagues actor ON actor.user_id=n.actor_id`;
export async function unreadCount(db: SocialDb, viewerId: string) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS count ${noticeJoins} WHERE ${noticeVisible} AND n.read_at IS NULL`,
    [viewerId],
  );
  return rows[0].count as number;
}
export async function listNotices(db: SocialDb, viewerId: string, cursor?: string) {
  const decoded = decodeCursor(cursor);
  const { rows } = await db.query(
    `SELECT n.*,actor.name,nt.equipped_title AS actor_title,m.id AS media_id ${noticeJoins} ${titleJoin('nt', 'n.actor_id')}
    LEFT JOIN LATERAL (SELECT id FROM pet_match.social_media WHERE post_id=p.id AND ready AND deleted_at IS NULL ORDER BY position,id LIMIT 1) m ON true
    WHERE ${noticeVisible} AND ($2::timestamptz IS NULL OR (n.created_at,n.id)<($2::timestamptz,$3::uuid))
    ORDER BY n.created_at DESC,n.id DESC LIMIT 51`,
    [viewerId, decoded?.[0] ?? null, decoded?.[1] ?? null],
  );
  const page = rows.slice(0, 50);
  const notices: SocialNotice[] = page.map((r) => ({
    id: r.id,
    postId: r.post_id,
    recipientId: r.recipient_id,
    actor: person(r.actor_id, r.name, r.actor_title),
    kind: r.kind,
    createdAt: r.created_at.toISOString(),
    excerpt: r.excerpt ?? undefined,
    read: !!r.read_at,
    photo: r.media_id ? { id: r.media_id, src: mediaUrl(r.media_id), alt: '' } : undefined,
  }));
  return {
    notices,
    nextCursor: rows.length > 50 ? encodeCursor(page.at(-1)) : null,
    unreadCount: await unreadCount(db, viewerId),
  };
}
