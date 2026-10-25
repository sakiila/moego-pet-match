import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { createPlayerLikesController, type PlayerLikesLoader, type PlayerLikesSender } from './playerLikes';

/** Reads are independent from profile/score requests and refresh when a tab becomes active. */
export function usePlayerLikes(targetId: string, viewerId: string, load: PlayerLikesLoader = api.getPlayerLikes, send: PlayerLikesSender = api.likePlayer) {
  const controller = useMemo(() => createPlayerLikesController(targetId, viewerId, load, send), [targetId, viewerId, load, send]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => {
    controller.resume();
    void controller.refresh();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      controller.dispose();
    };
  }, [controller]);
  return { ...state, refresh: controller.refresh, like: controller.like };
}
