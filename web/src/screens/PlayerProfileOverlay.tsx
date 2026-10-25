import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { ColleagueResult, GameMode, PlayerProfileView } from '../api/types';
import { PlayerProfileCard } from '../components/PlayerProfileCard/PlayerProfileCard';

export type ProfileLoader = (playerId: string, mode: GameMode, signal?: AbortSignal) => Promise<PlayerProfileView>;

export function PlayerProfileOverlay({ player, mode, onClose, load = api.getPlayerProfile }: {
  player: ColleagueResult; mode: GameMode; onClose: () => void; load?: ProfileLoader;
}) {
  const [view,setView] = useState<PlayerProfileView | null>(null);
  const [error,setError] = useState<'not_found' | 'unavailable' | null>(null);
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setView(null); setError(null);
    void load(player.userId,mode,controller.signal).then(data => {
      if (!controller.signal.aborted) setView(data);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof ApiError && error.kind === 'not_found' ? 'not_found' : 'unavailable');
    });
    return () => controller.abort();
  },[player.userId,mode,load,attempt]);
  return <PlayerProfileCard player={player} view={view} error={error} onRetry={() => setAttempt(value => value+1)} onClose={onClose} />;
}
