import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { AchievementId, ColleagueResult, GameMode, PlayerProfileView } from '../api/types';
import { PlayerProfileCard } from '../components/PlayerProfileCard/PlayerProfileCard';

export type ProfileLoader = (playerId: string, mode: GameMode, signal?: AbortSignal) => Promise<PlayerProfileView>;
/** 读取正在看名片的玩家自己已解锁的称号。 */
export type ViewerTitlesLoader = (playerId: string) => Promise<AchievementId[]>;

const loadUnlockedTitles: ViewerTitlesLoader = (playerId) =>
  api.getAchievements(playerId).then((v) => v.achievements.filter((a) => a.unlockedAt).map((a) => a.id));

export function PlayerProfileOverlay({ player, viewerId, mode, onClose, load = api.getPlayerProfile, loadViewerTitles = loadUnlockedTitles }: {
  player: ColleagueResult; viewerId: string; mode: GameMode; onClose: () => void; load?: ProfileLoader; loadViewerTitles?: ViewerTitlesLoader;
}) {
  const [view,setView] = useState<PlayerProfileView | null>(null);
  const [error,setError] = useState<'not_found' | 'unavailable' | null>(null);
  const [attempt,setAttempt] = useState(0);
  const [viewerTitles,setViewerTitles] = useState<AchievementId[]>([]);
  const own = viewerId === player.userId;
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
  // 看别人的名片：读自己已解锁的称号，没读到前或读取失败时隐藏条件一律保持喵喵喵
  useEffect(() => {
    if (own) return;
    let active = true;
    setViewerTitles([]);
    void loadViewerTitles(viewerId).then(titles => { if (active) setViewerTitles(titles); }).catch(() => {});
    return () => { active = false; };
  },[own,viewerId,loadViewerTitles]);
  return <PlayerProfileCard player={player} view={view} error={error} onRetry={() => setAttempt(value => value+1)} onClose={onClose}
    viewerTitles={own ? view?.unlockedTitles ?? [] : viewerTitles} />;
}
