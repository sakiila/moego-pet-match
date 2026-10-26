export const REACTION_KINDS = ['cute', 'pets', 'play', 'love'] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];
export interface SocialPerson {
  id: string;
  name: string;
  avatarSrc?: string;
}
export interface SocialPhoto {
  id: string;
  src: string;
  alt: string;
}
export interface SocialPet {
  id: string;
  name: string;
  stickerSrc?: string;
}
export interface SocialComment {
  id: string;
  author: SocialPerson;
  body: string;
  createdAt: string;
  /** Slack 线程回复同步而来，只读。 */
  source?: 'slack';
  replyTo?: SocialPerson;
}
export interface SocialPost {
  id: string;
  author: SocialPerson;
  body: string;
  createdAt: string;
  source: 'native' | 'slack';
  sourceUrl?: string;
  photos: SocialPhoto[];
  pet?: SocialPet;
  reactions: Record<ReactionKind, string[]>;
  reactionCounts?: Record<ReactionKind, number>;
  comments: SocialComment[];
  commentCount?: number;
  commentsCursor?: string | null;
  hidden?: boolean;
}
export interface SocialNotice {
  id: string;
  postId: string;
  recipientId: string;
  actor: SocialPerson;
  kind: ReactionKind | 'comment';
  createdAt: string;
  excerpt?: string;
  read: boolean;
  photo?: SocialPhoto;
}
export interface SocialState {
  version: 1;
  posts: SocialPost[];
  notices: SocialNotice[];
  feedIds?: string[];
  mineIds?: { native: string[]; slack: string[] };
  feedCursor?: string | null;
  mineCursors?: { native: string | null; slack: string | null };
  noticesCursor?: string | null;
  unreadCount?: number;
  reports?: { postId: string; body: string; createdAt: string }[];
}
export const MAX_PHOTOS = 9;
export const MAX_POST_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 500;
export const emptyReactions = (): SocialPost['reactions'] => ({ cute: [], pets: [], play: [], love: [] });

/** 显式设置选中状态；同一次操作重试不会重复计数。 */
export function setReaction(
  state: SocialState,
  postId: string,
  actor: SocialPerson,
  kind: ReactionKind,
  selected: boolean,
): SocialState {
  const post = state.posts.find((p) => p.id === postId && !p.hidden);
  if (!post) return state;
  const before = post.reactions[kind].includes(actor.id);
  if (before === selected) return state;
  const posts = state.posts.map((p) =>
    p.id !== postId
      ? p
      : {
          ...p,
          reactions: {
            ...p.reactions,
            [kind]: selected ? [...p.reactions[kind], actor.id] : p.reactions[kind].filter((id) => id !== actor.id),
          },
        },
  );
  const noticeId = `${postId}:${actor.id}:${kind}`;
  const notices = state.notices.filter((n) => n.id !== noticeId);
  if (selected && actor.id !== post.author.id)
    notices.unshift({
      id: noticeId,
      postId,
      recipientId: post.author.id,
      actor,
      kind,
      createdAt: new Date().toISOString(),
      read: false,
    });
  return { ...state, posts, notices };
}

export function publishPost(state: SocialState, post: SocialPost): SocialState {
  if (
    (!post.body.trim() && !post.photos.length) ||
    post.body.length > MAX_POST_LENGTH ||
    post.photos.length > MAX_PHOTOS
  )
    throw new Error('invalid_post');
  if (state.posts.some((p) => p.id === post.id)) return state;
  return { ...state, posts: [{ ...post, body: post.body.trim() }, ...state.posts] };
}

export function addComment(state: SocialState, postId: string, comment: SocialComment): SocialState {
  const post = state.posts.find((p) => p.id === postId && !p.hidden);
  if (!post || !comment.body.trim() || comment.body.length > MAX_COMMENT_LENGTH) throw new Error('invalid_comment');
  if (post.comments.some((c) => c.id === comment.id)) return state;
  const notices = [...state.notices];
  const recipients = new Set(
    [post.author.id, comment.replyTo?.id].filter((id): id is string => !!id && id !== comment.author.id),
  );
  for (const recipientId of recipients)
    notices.unshift({
      id: `${comment.id}:${recipientId}`,
      postId,
      recipientId,
      actor: comment.author,
      kind: 'comment',
      excerpt: comment.body.trim(),
      createdAt: comment.createdAt,
      read: false,
    });
  return {
    ...state,
    notices,
    posts: state.posts.map((p) =>
      p.id === postId ? { ...p, comments: [...p.comments, { ...comment, body: comment.body.trim() }] } : p,
    ),
  };
}

export function removePost(state: SocialState, postId: string, actorId: string): SocialState {
  const post = state.posts.find((p) => p.id === postId);
  if (!post || post.author.id !== actorId) throw new Error('forbidden');
  return {
    ...state,
    // 留下不含内容的同步墓碑，后续同步不会重新带回隐藏项。
    posts:
      post.source === 'slack'
        ? state.posts.map((p) =>
            p.id === postId
              ? { ...p, hidden: true, body: '', photos: [], comments: [], reactions: emptyReactions() }
              : p,
          )
        : state.posts.filter((p) => p.id !== postId),
    notices: state.notices.filter((n) => n.postId !== postId),
  };
}

export function deleteComment(state: SocialState, postId: string, commentId: string, actorId: string): SocialState {
  const post = state.posts.find((p) => p.id === postId);
  const comment = post?.comments.find((c) => c.id === commentId);
  if (!comment || comment.author.id !== actorId) throw new Error('forbidden');
  return {
    ...state,
    posts: state.posts.map((p) =>
      p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p,
    ),
    notices: state.notices.filter((n) => !n.id.startsWith(`${commentId}:`)),
  };
}

export function markNoticesRead(state: SocialState, recipientId: string, noticeId?: string): SocialState {
  return {
    ...state,
    notices: state.notices.map((n) =>
      n.recipientId === recipientId && (!noticeId || n.id === noticeId) ? { ...n, read: true } : n,
    ),
  };
}
