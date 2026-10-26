import { useEffect, useRef, useState } from 'react';
import { useI18n, type MessageKey } from '../../i18n';
import {
  emptyReactions,
  MAX_PHOTOS,
  type SocialPerson,
  type SocialPet,
  type SocialPhoto,
  type SocialPost,
  type SocialState,
} from '../../social/model';
import type { SocialActions } from '../../social/actions';
import { Avatar } from '../../ui/primitives/Avatar';
import { Icon } from '../../ui/primitives/Icon';
import { SocialHeader, SocialEmpty, type SocialLoadState } from './SocialChrome';
import { SocialGate } from './SocialGate';
import { SocialPostCard } from './SocialPostCard';
import { SocialComposer } from './SocialComposer';
import { SocialComments, SocialCommentInput, SOCIAL_COMMENT_INPUT } from './SocialComments';
import { SocialActivity } from './SocialActivity';
import { SocialPhotoViewer } from './SocialPhotoViewer';
import { SocialDialogs, type SocialOverlay } from './SocialDialogs';
import styles from './Social.module.css';

const COMMENTS_ID = 'social-comments';
export type SocialPage = { name: 'gate' | 'feed' | 'mine' | 'compose' | 'activity' } | { name: 'post'; id: string };
export interface SocialWallProps {
  state: SocialState;
  viewer: SocialPerson;
  pets: SocialPet[];
  initialPage?: SocialPage;
  initialState?: SocialLoadState;
  storageFailed?: boolean;
  actions: SocialActions;
  preview?: boolean;
  canModerate?: boolean;
  /** 点头像打开玩家卡片；不传时头像不可点。 */
  onAuthor?: (person: SocialPerson) => void;
  onPrepareRoute?: (page: SocialPage) => Promise<void>;
  onPageChange?: (page: SocialPage) => void;
  readPhoto: (file: File) => Promise<SocialPhoto>;
  onHome: () => void;
  onReset: () => void;
  /** 与浏览器 / 系统返回联动：站内每进一页压一条历史，返回统一走同一套回退。 */
  browserHistory?: boolean;
}

/** 社交模块的页面编排；所有帖子、身份和媒体都由上层传入。 */
export function SocialWall({
  state,
  viewer,
  pets,
  initialPage = { name: 'gate' },
  initialState = 'normal',
  storageFailed,
  actions,
  preview = true,
  canModerate = false,
  onAuthor,
  onPrepareRoute,
  onPageChange,
  readPhoto,
  onHome,
  onReset,
  browserHistory = false,
}: SocialWallProps) {
  const { t } = useI18n();
  const [page, setPage] = useState<SocialPage>(initialPage);
  const [listState, setListState] = useState<SocialLoadState>(initialState);
  const [sourceTab, setSourceTab] = useState<'native' | 'slack'>('native');
  const [overlay, setOverlay] = useState<SocialOverlay | null>(null);
  const [photoView, setPhotoView] = useState<{ postId: string; index: number } | null>(null);
  const [replyTo, setReplyTo] = useState<SocialPerson>();
  const [draft, setDraft] = useState({ body: '', photos: [] as SocialPhoto[], petId: '' });
  const [processing, setProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const draftVersion = useRef(0);
  const posting = useRef(false);
  const draftId = useRef(crypto.randomUUID());
  const inFlight = useRef(new Set<string>());
  const [pending, setPending] = useState<string[]>([]);
  const [modalError, setModalError] = useState('');
  const history = useRef<{ page: SocialPage; scroll: number }[]>([]);
  const visible = state.posts.filter((p) => !p.hidden);
  const current = page.name === 'post' ? visible.find((p) => p.id === page.id) : undefined;
  const notices = state.notices.filter((n) => n.recipientId === viewer.id);
  const photoPost = photoView ? visible.find((p) => p.id === photoView.postId) : undefined;
  const perform = async (key: string, operation: () => Promise<void>) => {
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setPending([...inFlight.current]);
    try {
      await operation();
    } catch {
      setToast(t('social.action_failed'));
    } finally {
      inFlight.current.delete(key);
      setPending([...inFlight.current]);
    }
  };
  /** 页面进场方向：前进从右侧滑入，返回从左侧滑入。 */
  const motion = useRef<'forward' | 'back'>('forward');
  const navigate = (next: SocialPage, then?: () => void) => {
    void perform('navigation', async () => {
      await onPrepareRoute?.(next);
      history.current.push({ page, scroll: window.scrollY });
      motion.current = 'forward';
      if (browserHistory) window.history.pushState({ social: history.current.length }, '');
      setPage(next);
      setReplyTo(undefined);
      setError('');
      window.scrollTo(0, 0);
      if (then) requestAnimationFrame(then);
    });
  };
  /** 回到来路页并恢复浏览位置；深链接没有来路时回动态列表。 */
  const restore = () => {
    const previous = history.current.pop();
    motion.current = 'back';
    setPage(previous?.page ?? { name: 'feed' });
    setReplyTo(undefined);
    requestAnimationFrame(() => window.scrollTo(0, previous?.scroll ?? 0));
  };
  const back = () => {
    if (browserHistory && history.current.length) window.history.back();
    else restore();
  };
  const dirty = page.name === 'compose' && (!!draft.body || !!draft.photos.length || processing);
  const leaveGuard = useRef({ dirty, overlay: false, restore });
  leaveGuard.current = { dirty, overlay: !!overlay || !!photoView, restore };
  /** 「回门店」与取消、系统返回共用草稿确认。 */
  const goHome = () => {
    if (publishing) return;
    if (dirty) setOverlay({ kind: 'discard', leave: 'home' });
    else onHome();
  };
  const releasePhotos = (photos: SocialPhoto[]) => {
    for (const photo of photos) void actions.releasePhoto?.(photo).catch(() => undefined);
  };
  const clearDraft = (release = true) => {
    if (release) releasePhotos(draft.photos);
    draftVersion.current++;
    leaveGuard.current.dirty = false;
    draftId.current = crypto.randomUUID();
    setDraft({ body: '', photos: [], petId: '' });
    setError('');
    setProcessing(false);
  };
  const cancelDraft = () => {
    if (publishing) return;
    if (dirty) setOverlay({ kind: 'discard', leave: 'back' });
    else {
      clearDraft();
      back();
    }
  };
  const files = async (selected: File[]) => {
    const remaining = MAX_PHOTOS - draft.photos.length;
    const version = draftVersion.current;
    setProcessing(true);
    setError(selected.length > remaining ? t('social.photo_limit', { max: MAX_PHOTOS }) : '');
    // 逐张解码并及时释放位图，避免九张高分辨率照片同时占用内存。
    const results: PromiseSettledResult<SocialPhoto>[] = [];
    for (const file of selected.slice(0, remaining)) {
      if (version !== draftVersion.current) {
        releasePhotos(results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])));
        return;
      }
      try {
        results.push({ status: 'fulfilled', value: await readPhoto(file) });
      } catch (reason) {
        results.push({ status: 'rejected', reason });
      }
    }
    if (version !== draftVersion.current) {
      releasePhotos(results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])));
      return;
    }
    const photos = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const rejected = results.find((r) => r.status === 'rejected');
    if (rejected?.status === 'rejected') {
      const key = rejected.reason instanceof Error ? rejected.reason.message : 'photo_decode';
      setError(
        t(
          key === 'photo_type'
            ? 'social.photo_type'
            : key === 'photo_large' || key === 'too_large'
              ? 'social.photo_large'
              : key === 'photo_decode' || key === 'unsupported_photo'
                ? 'social.photo_decode'
                : 'social.photo_failed',
        ),
      );
    }
    setDraft((d) => ({ ...d, photos: [...d.photos, ...photos].slice(0, MAX_PHOTOS) }));
    setProcessing(false);
  };
  const publish = async () => {
    if (posting.current || processing || (!draft.body.trim() && !draft.photos.length)) return;
    posting.current = true;
    setPublishing(true);
    const post: SocialPost = {
      id: draftId.current,
      author: viewer,
      body: draft.body,
      photos: draft.photos,
      pet: pets.find((p) => p.id === draft.petId),
      source: 'native',
      createdAt: new Date().toISOString(),
      comments: [],
      reactions: emptyReactions(),
    };
    try {
      const saved = await actions.publish(post);
      clearDraft(false);
      setListState('normal');
      // 新帖详情替换发布页；返回仍回到发起发布的列表与位置。
      setPage({ name: 'post', id: saved.id });
      setToast(t(preview ? 'social.publish_success' : 'social.publish_saved'));
      window.scrollTo(0, 0);
    } catch (failure) {
      setError(
        t(
          failure instanceof Error && failure.message === 'publish_conflict'
            ? 'social.publish_conflict'
            : 'social.action_failed',
        ),
      );
    } finally {
      posting.current = false;
      setPublishing(false);
    }
  };
  const confirm = async () => {
    if (inFlight.current.has('modal')) return;
    inFlight.current.add('modal');
    setPending([...inFlight.current]);
    setModalError('');
    try {
      if (overlay?.kind === 'discard') {
        // popstate 可能早于重新渲染，先同步放行这次离开。
        leaveGuard.current.overlay = false;
        clearDraft();
        if (overlay.leave === 'home') onHome();
        else back();
      }
      if (overlay?.kind === 'reset') {
        clearDraft();
        onReset();
        setPage({ name: 'feed' });
        setListState('normal');
        setToast(t('social.reset_done'));
      }
      if (overlay?.kind === 'remove') {
        const post = overlay.post;
        await actions.remove(post.id);
        setToast(t(post.source === 'slack' ? 'social.hidden' : 'social.deleted'));
        leaveGuard.current.overlay = false;
        if (page.name === 'post') back();
      }
      setOverlay(null);
    } catch {
      setModalError(t('social.action_failed'));
    } finally {
      inFlight.current.delete('modal');
      setPending([...inFlight.current]);
    }
  };
  useEffect(() => {
    onPageChange?.(page);
  }, [page, onPageChange]);
  useEffect(() => {
    if (!browserHistory) return;
    const pop = () => {
      const guard = leaveGuard.current;
      // 弹层、大图和未发布草稿先拦下这次返回，留在原页。
      if (guard.overlay || guard.dirty) {
        window.history.pushState({ social: history.current.length + 1 }, '');
        if (guard.overlay) {
          setOverlay(null);
          setPhotoView(null);
        } else setOverlay({ kind: 'discard', leave: 'back' });
        return;
      }
      guard.restore();
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [browserHistory]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (page.name !== 'compose' || (!draft.body && !draft.photos.length)) return;
    const beforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [page.name, draft.body, draft.photos.length]);
  const showComments = () => document.getElementById(COMMENTS_ID)?.scrollIntoView({ block: 'start' });
  const focusComment = () => {
    const input = document.getElementById(SOCIAL_COMMENT_INPUT);
    input?.scrollIntoView({ block: 'center' });
    input?.focus({ preventScroll: true });
  };
  const postCard = (post: SocialPost, detail = false) => (
    <SocialPostCard
      key={`${detail ? 'detail' : 'list'}:${post.id}`}
      post={post}
      viewerId={viewer.id}
      detail={detail}
      busy={pending.includes(`reaction:${post.id}`)}
      onOpen={() => navigate({ name: 'post', id: post.id })}
      onPhoto={(index) => setPhotoView({ postId: post.id, index })}
      onMenu={() => setOverlay({ kind: 'menu', post })}
      onReaction={(kind, selected) => {
        void perform(`reaction:${post.id}`, () => actions.reaction(post.id, kind, selected));
      }}
      onComments={() => (detail ? focusComment() : navigate({ name: 'post', id: post.id }, showComments))}
      onAuthor={onAuthor}
    />
  );
  const feed = page.name === 'feed';
  const mine = page.name === 'mine';
  const ids = mine ? state.mineIds?.[sourceTab] : state.feedIds;
  const list =
    listState === 'empty'
      ? []
      : ids
        ? ids.flatMap((id) => visible.find((p) => p.id === id) ?? [])
        : visible.filter((p) => !mine || (p.author.id === viewer.id && p.source === sourceTab));
  const nextPage = mine ? state.mineCursors?.[sourceTab] : state.feedCursor;
  const title: MessageKey =
    page.name === 'post' ? 'social.post_detail' : page.name === 'activity' ? 'social.activity' : 'social.my_posts';
  const from = history.current.at(-1)?.page.name;
  const backLabel = t(from === 'activity' ? 'social.back_activity' : from === 'mine' ? 'social.back_mine' : 'social.back_feed');
  const identity = { name: viewer.name, src: viewer.avatarSrc, onOpen: () => page.name !== 'mine' && navigate({ name: 'mine' }) };
  return (
    <main className={styles.root}>
      {preview && <p className={styles.preview}>{t('social.preview')}</p>}
      {pending.includes('navigation') && (
        <p className={styles.navLoading} role="status">
          <span className={styles.visuallyHidden}>{t('social.loading')}</span>
        </p>
      )}
      {storageFailed && (
        <p className={styles.hint} role="status">
          {t('social.storage_failed')}
        </p>
      )}
      <div
        key={page.name === 'post' ? `post:${page.id}` : page.name}
        className={styles.page}
        data-motion={motion.current}
      >
      {page.name === 'gate' ? (
        <SocialGate
          onContinue={() => navigate({ name: 'feed' })}
          onBack={onHome}
          onInfo={() => setOverlay({ kind: 'info' })}
        />
      ) : page.name === 'compose' ? (
        <>
          <SocialHeader
            title={t('social.new_post')}
            onHome={goHome}
            identity={identity}
            back={{ label: t('social.cancel'), onClick: cancelDraft }}
          >
            <button
              className={styles.smallCta}
              onClick={() => {
                void publish();
              }}
              disabled={processing || publishing || (!draft.body.trim() && !draft.photos.length)}
            >
              {t(publishing ? 'social.publish_busy' : 'social.publish')}
            </button>
          </SocialHeader>
          <SocialComposer
            author={viewer}
            {...draft}
            pets={pets}
            processing={processing}
            publishing={publishing}
            error={error}
            onBody={(body) => setDraft((d) => ({ ...d, body }))}
            onPet={(petId) => setDraft((d) => ({ ...d, petId }))}
            onFiles={(selected) => {
              void files(selected);
            }}
            onRemovePhoto={(id) => {
              const photo = draft.photos.find((p) => p.id === id);
              if (photo) releasePhotos([photo]);
              setDraft((d) => ({ ...d, photos: d.photos.filter((p) => p.id !== id) }));
            }}
          />
        </>
      ) : (
        <>
          <SocialHeader
            title={t(feed ? 'social.title' : title)}
            onHome={goHome}
            identity={identity}
            back={feed ? undefined : { label: backLabel, onClick: back }}
          >
            {feed ? (
              <>
                <button
                  className={styles.iconButton}
                  aria-label={t('social.activity')}
                  onClick={() => navigate({ name: 'activity' })}
                >
                  <Icon name="social-bell" size={26} />
                  {(state.unreadCount ?? notices.filter((n) => !n.read).length) > 0 && (
                    <span className={styles.unreadDot} />
                  )}
                </button>
                <button className={`${styles.smallCta} ${styles.publishCta}`} onClick={() => navigate({ name: 'compose' })}>
                  ＋ {t('social.publish')}
                </button>
              </>
            ) : page.name === 'activity' ? (
              <button
                className={styles.textButton}
                onClick={() => {
                  void perform('read', () => actions.readNotices());
                }}
              >
                {t('social.mark_read')}
              </button>
            ) : mine ? (
              <button
                className={`${styles.iconButton} ${styles.createButton}`}
                aria-label={t('social.new_post')}
                onClick={() => navigate({ name: 'compose' })}
              >
                <Icon name="social-pencil" size={24} />
              </button>
            ) : (
              <button
                className={styles.iconButton}
                aria-label={t('social.more')}
                disabled={!current}
                onClick={() => current && setOverlay({ kind: 'menu', post: current })}
              >
                <Icon name="social-more" size={23} />
              </button>
            )}
          </SocialHeader>
          {(feed || mine) && (
            <>
              {feed ? (
                <p className={styles.subtitle}>{t('social.subtitle')}</p>
              ) : (
                <div className={styles.profile}>
                  <Avatar name={viewer.name} src={viewer.avatarSrc} seed={viewer.id} size={42} />
                  <div>
                    <strong className={styles.name}>{viewer.name}</strong>
                    <span className={styles.meta}>{t('social.my_description')}</span>
                  </div>
                </div>
              )}
              <div className={styles.tabs} role="tablist" aria-label={t('social.title')}>
                {feed ? (
                  <>
                    <button className={styles.tab} role="tab" aria-selected onClick={() => {}}>
                      {t('social.all')}
                    </button>
                    <button
                      className={styles.tab}
                      role="tab"
                      aria-selected={false}
                      onClick={() => navigate({ name: 'mine' })}
                    >
                      {t('social.mine')}
                    </button>
                  </>
                ) : (
                  (['native', 'slack'] as const).map((source) => (
                    <button
                      key={source}
                      className={styles.tab}
                      role="tab"
                      aria-selected={sourceTab === source}
                      onClick={() => {
                        void perform('navigation', async () => {
                          await actions.loadMine?.(source);
                          setSourceTab(source);
                        });
                      }}
                    >
                      {t(source === 'native' ? 'social.published' : 'social.imported')}
                    </button>
                  ))
                )}
              </div>
              {listState === 'loading' || listState === 'error' ? (
                <SocialEmpty state={listState} onRetry={() => setListState('normal')} />
              ) : !list.length ? (
                <SocialEmpty
                  title={mine ? t(sourceTab === 'native' ? 'social.empty_mine' : 'social.empty_imported') : undefined}
                  onCreate={() => navigate({ name: 'compose' })}
                />
              ) : (
                list.map((p) => postCard(p))
              )}
              {nextPage && (
                <button
                  className={styles.textButton}
                  disabled={pending.includes('more')}
                  onClick={() => {
                    void perform('more', async () => {
                      await actions.loadMorePosts?.(mine ? 'mine' : 'all', sourceTab);
                    });
                  }}
                >
                  {t('social.load_more')}
                </button>
              )}
            </>
          )}
          {page.name === 'post' &&
            (current ? (
              <>
                {postCard(current, true)}
                {current.commentsCursor && (
                  <button
                    className={styles.textButton}
                    disabled={pending.includes('comments')}
                    onClick={() => {
                      void perform('comments', async () => {
                        await actions.loadEarlierComments?.(current.id);
                      });
                    }}
                  >
                    {t('social.earlier_comments')}
                  </button>
                )}
                <SocialComments
                  id={COMMENTS_ID}
                  comments={current.comments}
                  total={current.commentCount}
                  viewerId={viewer.id}
                  replyTo={replyTo}
                  onReply={setReplyTo}
                  onAuthor={onAuthor}
                  onDelete={(id) => {
                    void perform(`comment:${id}`, () => actions.deleteComment(current.id, id));
                  }}
                />
                <SocialCommentInput
                  key={current.id}
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(undefined)}
                  onSend={async (body, id) => {
                    await actions.comment(current.id, {
                      id,
                      author: viewer,
                      body,
                      replyTo,
                      createdAt: new Date().toISOString(),
                    });
                    setReplyTo(undefined);
                  }}
                />
              </>
            ) : (
              <SocialEmpty
                title={t('social.removed')}
                body={t('social.removed_body')}
                actionLabel={backLabel}
                onAction={back}
                state="empty"
              />
            ))}
          {page.name === 'activity' && (
            <SocialActivity
              notices={notices}
              posts={visible}
              onOpen={(n) => {
                void perform(`read:${n.id}`, () => actions.readNotices(n.id));
                navigate({ name: 'post', id: n.postId }, n.kind === 'comment' ? showComments : undefined);
              }}
            />
          )}
          {page.name === 'activity' && state.noticesCursor && (
            <button
              className={styles.textButton}
              disabled={pending.includes('notices')}
              onClick={() => {
                void perform('notices', async () => {
                  await actions.loadMoreNotices?.();
                });
              }}
            >
              {t('social.load_more')}
            </button>
          )}
        </>
      )}
      </div>
      {preview && page.name !== 'compose' && (
        <footer className={styles.previewTools}>
          <label>
            {t('social.preview_states')}{' '}
            <select
              value={listState}
              onChange={(e) => {
                setListState(e.target.value as SocialLoadState);
                setPage({ name: 'feed' });
              }}
            >
              {(['normal', 'empty', 'loading', 'error'] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`social.state_${value}`)}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => setPage({ name: 'gate' })}>{t('social.state_gate')}</button>
          <button onClick={() => setOverlay({ kind: 'reset' })}>{t('social.preview_reset')}</button>
        </footer>
      )}
      {!preview && page.name !== 'compose' && (
        <footer className={styles.previewTools}>
          <button onClick={() => setOverlay({ kind: 'info' })}>{t('social.info')}</button>
        </footer>
      )}
      {overlay && (
        <SocialDialogs
          key={overlay.kind}
          overlay={overlay}
          viewerId={viewer.id}
          canModerate={canModerate}
          preview={preview}
          busy={pending.includes('modal')}
          error={modalError}
          onClose={() => {
            if (!inFlight.current.has('modal')) {
              setOverlay(null);
              setModalError('');
            }
          }}
          onChoose={setOverlay}
          onConfirm={() => {
            void confirm();
          }}
          onFeedback={(body) => {
            void perform('modal', async () => {
              try {
                await actions.report('post' in overlay ? overlay.post.id : '', body);
                setOverlay(null);
                setToast(t(preview ? 'social.feedback_saved' : 'social.feedback_sent'));
              } catch {
                setModalError(t('social.action_failed'));
              }
            });
          }}
        />
      )}
      {photoView && photoPost && (
        <SocialPhotoViewer
          post={photoPost}
          initialIndex={photoView.index}
          onClose={() => setPhotoView(null)}
          onHome={goHome}
        />
      )}
      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
