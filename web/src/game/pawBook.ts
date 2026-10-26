import { ApiError } from '../api/client';
import type { PawBookView, PawMessage, PetPaw } from '../api/types';

export interface PawBookApi {
  getPawBook: (pet: string, player: string, cursor?: string | null) => Promise<PawBookView>;
  changePaw: (pet: string, player: string, message: PawMessage | null, version: number, limit?: number) => Promise<PawBookView>;
  replyPaw: (pet: string, player: string, id: string, version: number, limit?: number) => Promise<PawBookView>;
  readPaws: (pet: string, player: string, ids: string[], kind: 'message' | 'reply') => Promise<{ ok: true }>;
}
export interface PawBookState {
  view: PawBookView | null;
  loading: boolean;
  loadingMore: boolean;
  sending: boolean;
  error: 'load' | 'send' | null;
  unavailable: boolean;
  celebration: number;
}

export function createPawBookController(petId: string, playerId: string, api: PawBookApi, changed = () => {}) {
  let state: PawBookState = { view: null, loading: true, loadingMore: false, sending: false, error: null, unavailable: false, celebration: 0 };
  const listeners = new Set<() => void>();
  const reading = new Set<string>();
  let active = true, epoch = 0;
  const update = (next: Partial<PawBookState>) => {
    state = { ...state, ...next };
    listeners.forEach(fn => fn());
  };
  const failure = (error: unknown, kind: 'load' | 'send') => {
    const unavailable = error instanceof ApiError && error.kind === 'not_found';
    update({ loading: false, loadingMore: false, sending: false, error: kind, unavailable, ...(unavailable ? { view: null } : {}) });
  };
  const refresh = async () => {
    if (!active || state.sending) return;
    const sequence = ++epoch;
    update({ loading: !state.view, loadingMore: false, error: null });
    try {
      const view = await api.getPawBook(petId, playerId);
      if (active && sequence === epoch) update({ view, loading: false, unavailable: false });
    } catch (error) { if (active && sequence === epoch) failure(error, 'load'); }
  };
  const mutate = async (operation: () => Promise<PawBookView>, confirmed: (view: PawBookView) => boolean) => {
    if (!active || state.sending || !state.view) return;
    const sequence = ++epoch;
    update({ sending: true, loadingMore: false, error: null });
    try {
      const view = await operation();
      if (active && sequence === epoch) {
        update({ view, sending: false, loading: false, celebration: state.celebration + 1 }); changed();
      }
    } catch (error) {
      if (!active || sequence !== epoch) return;
      failure(error, 'send');
      // 请求可能已落库；重新同步确认状态，但不自动重复发送旧意图。
      try {
        const view = await api.getPawBook(petId, playerId);
        if (active && sequence === epoch) { update({ view, unavailable: false, error: confirmed(view) ? null : 'send' }); changed(); }
      } catch { /* 保留发送失败提示与最后确认的状态。 */ }
    }
  };
  return {
    getSnapshot: () => state,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    resume() { active = true; },
    refresh,
    async loadMore() {
      if (!active || state.sending || state.loadingMore || !state.view?.nextCursor) return;
      const sequence = ++epoch;
      const previous = state.view;
      update({ loadingMore: true, error: null });
      try {
        const page = await api.getPawBook(petId, playerId, previous.nextCursor);
        if (active && sequence === epoch) {
          const entries = [...new Map([...previous.entries, ...page.entries].map(p => [p.id, p])).values()];
          update({ view: { ...page, entries }, loadingMore: false });
        }
      } catch (error) { if (active && sequence === epoch) failure(error, 'load'); }
    },
    change(message: PawMessage | null) {
      const view = state.view;
      if (!view || view.own || (view.mine?.message ?? null) === message) return Promise.resolve();
      return mutate(() => api.changePaw(petId, playerId, message, view.mineVersion, Math.min(1000, Math.max(20, view.entries.length))), next => (next.mine?.message ?? null) === message);
    },
    reply(paw: PetPaw) {
      if (!state.view?.own || paw.reply) return Promise.resolve();
      const limit = Math.min(1000, Math.max(20, state.view.entries.length));
      return mutate(() => api.replyPaw(petId, playerId, paw.id, paw.version, limit), next => next.entries.some(p => p.id === paw.id && p.reply));
    },
    async read(id: string, kind: 'message' | 'reply') {
      const key = `${kind}:${id}`;
      if (!active || reading.has(key)) return;
      reading.add(key);
      try {
        await api.readPaws(petId, playerId, [id], kind);
        if (!active || !state.view) return;
        const wasUnread = state.view.entries.find(p => p.id === id)?.unreadMessage;
        const seen = (paw: PetPaw) => paw.id === id ? { ...paw, [kind === 'message' ? 'unreadMessage' : 'unreadReply']: false } : paw;
        update({ view: { ...state.view, unreadCount: Math.max(0, state.view.unreadCount - (kind === 'message' && wasUnread ? 1 : 0)),
          mine: state.view.mine ? seen(state.view.mine) : null, entries: state.view.entries.map(seen) } });
        changed();
      } catch { /* 未确认已读时保留提醒，下次查看会重试。 */ }
      finally { reading.delete(key); }
    },
    dispose() { active = false; ++epoch; },
  };
}
