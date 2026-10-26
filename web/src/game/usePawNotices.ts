import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { isGalleryPath } from '../app/entryRoute';
import type { PawNotices } from '../api/types';

const EMPTY: PawNotices = { messages: [], replies: [] };
const EVENT = 'pet-match:paws-changed';
export function pawNoticesChanged() { window.dispatchEvent(new Event(EVENT)); }

export function usePawNotices(playerId: string) {
  const [data, setData] = useState({ playerId, value: EMPTY });
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    if (isGalleryPath(location.pathname)) return;
    const token = ++sequence.current;
    try {
      const value = await api.getPawNotices(playerId);
      if (token === sequence.current) setData({ playerId, value });
    } catch { /* 独立提示读取失败不影响导航；下次回访或互动时刷新。 */ }
  }, [playerId]);
  useEffect(() => {
    void refresh();
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', visible);
    window.addEventListener(EVENT, refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      ++sequence.current;
      window.removeEventListener('focus', visible); window.removeEventListener(EVENT, refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  return data.playerId === playerId ? data.value : EMPTY;
}
