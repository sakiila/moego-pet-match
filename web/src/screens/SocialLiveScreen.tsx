import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { socialApi, SocialApiError, type SocialSession, type PostPage } from '../api/social';
import type { SocialState, SocialPost } from '../social/model';
import type { SocialActions } from '../social/actions';
import type { SocialPage } from '../components/social/SocialWall';
import { SocialHeader, SocialEmpty } from '../components/social/SocialChrome';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { SocialWallScreen } from './SocialWallScreen';
import { useI18n } from '../i18n';
import styles from '../components/social/Social.module.css';

const initial = (): SocialState => ({
  version: 1,
  posts: [],
  notices: [],
  feedIds: [],
  mineIds: { native: [], slack: [] },
  mineCursors: { native: null, slack: null },
  feedCursor: null,
  noticesCursor: null,
  unreadCount: 0,
});
const unique = (values: string[]) => [...new Set(values)];
function mergePost(state: SocialState, post: SocialPost, keepEarlier = false): SocialState {
  const old = state.posts.find((p) => p.id === post.id);
  const comments =
    keepEarlier && old
      ? [...new Map([...old.comments, ...post.comments].map((c) => [c.id, c])).values()].sort(
          (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
        )
      : post.comments;
  const next = {
    ...post,
    comments,
    commentsCursor:
      keepEarlier && old && old.comments.length > post.comments.length ? old.commentsCursor : post.commentsCursor,
  };
  return { ...state, posts: old ? state.posts.map((p) => (p.id === post.id ? next : p)) : [next, ...state.posts] };
}
function mergePage(
  state: SocialState,
  page: PostPage,
  scope: 'all' | 'mine',
  source: 'native' | 'slack',
  append: boolean,
): SocialState {
  const oldIds = scope === 'all' ? (state.feedIds ?? []) : (state.mineIds?.[source] ?? []);
  const oldCursor = scope === 'all' ? state.feedCursor : state.mineCursors?.[source];
  let next = state;
  for (const post of page.posts)
    next = mergePost(next, { ...post, comments: next.posts.find((p) => p.id === post.id)?.comments ?? [] }, true);
  const ids = page.posts.map((p) => p.id);
  const boundary = page.posts.at(-1);
  const tail =
    !append && page.nextCursor && boundary
      ? oldIds.filter((id) => {
          const p = state.posts.find((p) => p.id === id);
          return p && (p.createdAt < boundary.createdAt || (p.createdAt === boundary.createdAt && id < boundary.id));
        })
      : [];
  const all = append ? unique([...oldIds, ...ids]) : unique([...ids, ...tail]);
  const cursor = append ? page.nextCursor : tail.length ? (oldCursor ?? null) : page.nextCursor;
  return scope === 'all'
    ? { ...next, feedIds: all, feedCursor: cursor }
    : {
        ...next,
        mineIds: { native: next.mineIds?.native ?? [], slack: next.mineIds?.slack ?? [], [source]: all },
        mineCursors: {
          native: next.mineCursors?.native ?? null,
          slack: next.mineCursors?.slack ?? null,
          [source]: cursor,
        },
      };
}

/** 真实服务容器；视觉和交互仍复用同一组已验收组件。 */
export function SocialLiveScreen({ onHome }: { onHome: () => void }) {
  const { t } = useI18n();
  const [state, setState] = useState<SocialState>(initial);
  const data = useRef(state);
  const revision = useRef(0);
  const requestEpoch = useRef(0);
  const activePage = useRef<SocialPage>({ name: 'feed' });
  const activeSource = useRef<'native' | 'slack'>('native');
  const [session, setSession] = useState<SocialSession>();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error' | 'disabled'>('loading');
  const [refreshFailed, setRefreshFailed] = useState(false);
  const polling = useRef(false);
  const update = useCallback((fn: (value: SocialState) => SocialState) => {
    const next = fn(data.current);
    data.current = next;
    setState(next);
  }, []);
  const stableRead = useCallback(async <T,>(read: () => Promise<T>, apply: (result: T) => void) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const stamp = revision.current;
      const result = await read();
      if (stamp === revision.current) {
        apply(result);
        return;
      }
    }
    throw new SocialApiError(409, 'changed_during_read');
  }, []);
  const loadPosts = useCallback(
    async (scope: 'all' | 'mine', source: 'native' | 'slack' = 'native', append = false) => {
      const cursor = append ? (scope === 'all' ? data.current.feedCursor : data.current.mineCursors?.[source]) : null;
      if (append && !cursor) return;
      await stableRead(
        () => socialApi.posts(scope, source, cursor),
        (page) => update((s) => mergePage(s, page, scope, source, append)),
      );
    },
    [stableRead, update],
  );
  const loadNotices = useCallback(
    async (append = false) => {
      if (append && !data.current.noticesCursor) return;
      await stableRead(
        () => socialApi.notices(append ? data.current.noticesCursor : null),
        (page) =>
          update((s) => ({
            ...s,
            notices: append
              ? [...new Map([...s.notices, ...page.notices].map((n) => [n.id, n])).values()]
              : page.notices,
            noticesCursor: page.nextCursor,
            unreadCount: page.unreadCount,
          })),
      );
    },
    [stableRead, update],
  );
  const loadPost = useCallback(
    async (id: string) => {
      try {
        await stableRead(
          () => socialApi.post(id),
          (post) => update((s) => mergePost(s, post)),
        );
      } catch (error) {
        if (error instanceof SocialApiError && error.status === 404) {
          update((s) => ({
            ...s,
            posts: s.posts.filter((p) => p.id !== id),
            feedIds: s.feedIds?.filter((x) => x !== id),
            notices: s.notices.filter((n) => n.postId !== id),
          }));
          return;
        }
        throw error;
      }
    },
    [stableRead, update],
  );
  const loadInitial = useCallback(async () => {
    const epoch = ++requestEpoch.current;
    setPhase('loading');
    try {
      const [who, posts, notices] = await Promise.all([socialApi.session(), socialApi.posts(), socialApi.notices()]);
      if (epoch !== requestEpoch.current) return;
      setSession(who);
      update(() => ({
        ...mergePage(initial(), posts, 'all', 'native', false),
        notices: notices.notices,
        noticesCursor: notices.nextCursor,
        unreadCount: notices.unreadCount,
      }));
      setPhase('ready');
    } catch (error) {
      if (epoch === requestEpoch.current)
        setPhase(error instanceof SocialApiError && error.status === 404 ? 'disabled' : 'error');
    }
  }, [update]);
  useEffect(() => {
    void loadInitial();
    return () => {
      requestEpoch.current++;
    };
  }, [loadInitial]);
  const prepare = useCallback(
    async (page: SocialPage) => {
      if (page.name === 'post') await loadPost(page.id);
      if (page.name === 'mine') await loadPosts('mine', activeSource.current);
      if (page.name === 'activity') await loadNotices();
    },
    [loadPost, loadPosts, loadNotices],
  );
  const pageChanged = useCallback((page: SocialPage) => {
    activePage.current = page;
  }, []);
  const refresh = useCallback(async () => {
    if (polling.current || document.visibilityState === 'hidden') return;
    polling.current = true;
    try {
      const page = activePage.current;
      if (page.name === 'feed') await loadPosts('all');
      else if (page.name === 'mine') await loadPosts('mine', activeSource.current);
      else if (page.name === 'post') await loadPost(page.id);
      if (page.name !== 'compose') await loadNotices();
      setRefreshFailed(false);
    } catch {
      setRefreshFailed(true);
    } finally {
      polling.current = false;
    }
  }, [loadPost, loadPosts, loadNotices]);
  useEffect(() => {
    if (phase !== 'ready') return;
    const timer = setInterval(() => {
      void refresh();
    }, 30000);
    const focus = () => {
      void refresh();
    };
    window.addEventListener('focus', focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', focus);
    };
  }, [phase, refresh]);
  const actions = useMemo<SocialActions>(
    () => ({
      async publish(value) {
        const saved = await socialApi.publish(value);
        revision.current++;
        update((s) => {
          const next = mergePost(s, saved);
          return {
            ...next,
            feedIds: unique([saved.id, ...(next.feedIds ?? [])]),
            mineIds: { native: unique([saved.id, ...(next.mineIds?.native ?? [])]), slack: next.mineIds?.slack ?? [] },
          };
        });
        return saved;
      },
      async reaction(id, kind, selected) {
        const post = await socialApi.reaction(id, kind, selected);
        revision.current++;
        update((s) => mergePost(s, post, true));
      },
      async comment(id, comment) {
        const post = await socialApi.comment(id, comment);
        revision.current++;
        update((s) => mergePost(s, post, true));
      },
      async deleteComment(id, commentId) {
        const post = await socialApi.deleteComment(id, commentId);
        revision.current++;
        update((s) =>
          mergePost(
            {
              ...s,
              posts: s.posts.map((p) =>
                p.id === id ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p,
              ),
            },
            post,
            true,
          ),
        );
      },
      async remove(id) {
        const result = await socialApi.remove(id);
        revision.current++;
        update((s) => ({
          ...s,
          posts: s.posts.filter((p) => p.id !== id),
          feedIds: s.feedIds?.filter((x) => x !== id),
          mineIds: {
            native: s.mineIds?.native.filter((x) => x !== id) ?? [],
            slack: s.mineIds?.slack.filter((x) => x !== id) ?? [],
          },
          notices: s.notices.filter((n) => n.postId !== id),
          unreadCount: result.unreadCount,
        }));
      },
      async readNotices(id) {
        const result = await socialApi.read(id);
        revision.current++;
        update((s) => ({
          ...s,
          notices: s.notices.map((n) => (!id || n.id === id ? { ...n, read: true } : n)),
          unreadCount: result.unreadCount,
        }));
      },
      async report(id, body) {
        await socialApi.report(id, body);
      },
      async releasePhoto(photo) {
        await socialApi.release(photo);
      },
      async loadMine(source) {
        await loadPosts('mine', source);
        activeSource.current = source;
      },
      loadMorePosts: (scope, source) => loadPosts(scope, source, true),
      loadMoreNotices: () => loadNotices(true),
      async loadEarlierComments(id) {
        const cursor = data.current.posts.find((p) => p.id === id)?.commentsCursor;
        if (!cursor) return;
        await stableRead(
          () => socialApi.comments(id, cursor),
          (page) =>
            update((s) => ({
              ...s,
              posts: s.posts.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      comments: [...new Map([...page.comments, ...p.comments].map((c) => [c.id, c])).values()],
                      commentsCursor: page.nextCursor,
                    }
                  : p,
              ),
            })),
        );
      },
    }),
    [loadPosts, loadNotices, stableRead, update],
  );
  if (phase !== 'ready' || !session)
    return (
      <main className={styles.root}>
        <SocialHeader title={t('social.title')} onHome={onHome} />
        <SocialEmpty
          state={phase === 'loading' ? 'loading' : phase === 'disabled' ? 'empty' : 'error'}
          title={phase === 'disabled' ? t('social.disabled') : undefined}
          body={phase === 'disabled' ? t('social.disabled_body') : undefined}
          onRetry={() => {
            void loadInitial();
          }}
        />
      </main>
    );
  return (
    <>
      {refreshFailed && (
        <StatusMessage
          text={t('social.refresh_failed')}
          actionLabel={t('social.retry')}
          onAction={() => {
            void refresh();
          }}
        />
      )}
      <SocialWallScreen
        state={state}
        viewer={session.viewer}
        pets={session.pets}
        canModerate={session.canModerate}
        preview={false}
        initialPage={{ name: 'feed' }}
        onPrepareRoute={prepare}
        onPageChange={pageChanged}
        actions={actions}
        readPhoto={socialApi.upload}
        onHome={onHome}
        onReset={() => {}}
        browserHistory
      />
    </>
  );
}
