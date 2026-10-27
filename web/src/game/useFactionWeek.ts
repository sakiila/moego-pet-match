import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { Faction, FactionState } from '../api/types';

export type FactionLoader = (playerId: string) => Promise<FactionState>;
export type FactionJoiner = (playerId: string, faction: Faction) => Promise<FactionState>;

const REFRESH_MS = 30_000;
const LEADER_KEY = 'pet-match.faction-leader';

/** 上次看到的领先方：换人时首页提示一次「反超」。存储不可用时不提示。 */
function rememberLeader(eventId: string, leader: Faction | null): Faction | null {
  try {
    const key = `${LEADER_KEY}.${eventId}`;
    const previous = localStorage.getItem(key);
    if (leader) localStorage.setItem(key, leader);
    return leader && previous && previous !== leader ? leader : null;
  } catch {
    return null;
  }
}

/**
 * 首页阵营卡的数据：打开时读取，页面可见时每 30 秒刷新（不用长连接）。
 * 读取失败保留上次结果；陈列页传入示例 loader，不访问接口。
 */
export function useFactionWeek(playerId: string, load: FactionLoader = api.getFaction, send: FactionJoiner = api.joinFaction) {
  const [state, setState] = useState<FactionState | null>(null);
  const [failed, setFailed] = useState(false);
  const [overtake, setOvertake] = useState<Faction | null>(null);
  const alive = useRef(true);

  const accept = useCallback((next: FactionState) => {
    if (!alive.current) return;
    setState(next);
    setFailed(false);
    if (next.phase === 'active' || next.phase === 'fog') {
      const changed = rememberLeader(next.eventId, next.lead.leader);
      if (changed) setOvertake(changed);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      accept(await load(playerId));
    } catch {
      if (alive.current) setFailed(true);
    }
  }, [accept, load, playerId]);

  useEffect(() => {
    alive.current = true;
    void refresh();
    const tick = () => { if (document.visibilityState === 'visible') void refresh(); };
    const timer = window.setInterval(tick, REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      alive.current = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  /** 报名成功返回最新状态；失败抛出，由报名弹层显示原因。 */
  const join = useCallback(async (faction: Faction) => accept(await send(playerId, faction)), [accept, send, playerId]);

  return { state, failed, overtake, refresh, join };
}
