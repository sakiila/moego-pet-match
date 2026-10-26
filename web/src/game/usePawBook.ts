import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { isGalleryPath } from '../app/entryRoute';
import { createPawBookController } from './pawBook';
import { pawNoticesChanged } from './usePawNotices';

export function usePawBook(petId: string, playerId: string, enabled: boolean) {
  const controller = useMemo(() => createPawBookController(petId, playerId, api, pawNoticesChanged), [petId, playerId]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => {
    if (!enabled || isGalleryPath(location.pathname)) return;
    controller.resume(); void controller.refresh();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.dispose(); window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [controller, enabled]);
  return { state, controller };
}
