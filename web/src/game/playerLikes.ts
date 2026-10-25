import type { PlayerLikesView } from '../api/types';

export type PlayerLikesLoader = (targetId: string, viewerId: string, signal?: AbortSignal) => Promise<PlayerLikesView>;
export type PlayerLikesSender = (targetId: string, viewerId: string) => Promise<PlayerLikesView>;
export interface PlayerLikesState {
  view: PlayerLikesView | null;
  loading: boolean;
  sending: boolean;
  error: 'load' | 'send' | null;
  celebration: number;
}

/** One target/viewer pair per controller keeps late responses out of a newly opened card. */
export function createPlayerLikesController(targetId: string, viewerId: string, load: PlayerLikesLoader, send: PlayerLikesSender) {
  let state: PlayerLikesState = { view: null, loading: true, sending: false, error: null, celebration: 0 };
  const listeners = new Set<() => void>();
  let active = true;
  let lifetime = 0;
  let readSequence = 0;
  let read: AbortController | null = null;
  const update = (next: Partial<PlayerLikesState>) => {
    state = { ...state, ...next };
    listeners.forEach(listener => listener());
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    resume() {
      active = true;
      update({ sending: false });
    },
    async refresh() {
      if (!active || state.sending) return;
      read?.abort();
      const controller = new AbortController();
      read = controller;
      const sequence = ++readSequence;
      update({ loading: !state.view, error: null });
      try {
        const view = await load(targetId, viewerId, controller.signal);
        if (active && !controller.signal.aborted && sequence === readSequence) update({ view, loading: false });
      } catch {
        if (active && !controller.signal.aborted && sequence === readSequence) update({ loading: false, error: 'load' });
      }
    },
    async like() {
      if (!active || targetId === viewerId || state.sending || !state.view?.canLike || state.view.likedByViewer) return;
      // Set the lock before sending; React batching cannot admit a second click.
      update({ sending: true, error: null });
      read?.abort();
      ++readSequence;
      const generation = lifetime;
      try {
        const view = await send(targetId, viewerId);
        if (active && generation === lifetime) update({ view, sending: false, loading: false, celebration: state.celebration + 1 });
      } catch {
        if (active && generation === lifetime) update({ sending: false, error: 'send' });
      }
    },
    dispose() {
      active = false;
      ++lifetime;
      read?.abort();
    },
  };
}
