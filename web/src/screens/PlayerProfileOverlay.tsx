import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { AchievementId, ColleagueResult, GameMode, PlayerProfileView } from '../api/types';
import { PlayerProfileCard } from '../components/PlayerProfileCard/PlayerProfileCard';
import { usePlayerLikes } from '../game/usePlayerLikes';
import type { PlayerLikesLoader, PlayerLikesSender } from '../game/playerLikes';

export type ProfileLoader = (playerId: string, mode: GameMode, signal?: AbortSignal) => Promise<PlayerProfileView>;
/** 读取正在看名片的玩家自己已解锁的称号。 */
export type ViewerTitlesLoader = (playerId: string) => Promise<AchievementId[]>;

export const loadUnlockedTitles: ViewerTitlesLoader = (playerId) =>
  api.getAchievements(playerId).then((v) => v.achievements.filter((a) => a.unlockedAt).map((a) => a.id));

export function PlayerProfileOverlay({ player, viewerId, mode, onClose, load = api.getPlayerProfile, loadViewerTitles = loadUnlockedTitles, loadLikes, sendLike }: {
  player: ColleagueResult; viewerId: string; mode: GameMode; onClose: () => void; load?: ProfileLoader; loadViewerTitles?: ViewerTitlesLoader;
  loadLikes?: PlayerLikesLoader; sendLike?: PlayerLikesSender;
}) {
  const [view,setView] = useState<PlayerProfileView | null>(null);
  const [error,setError] = useState<'not_found' | 'unavailable' | null>(null);
  const [attempt,setAttempt] = useState(0);
  const [viewerTitles,setViewerTitles] = useState<AchievementId[]>([]);
  const own = viewerId === player.userId;
  const likes = usePlayerLikes(player.userId, viewerId, loadLikes, sendLike);
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
  // 看别人的名片：按自己已解锁的称号揭晓名称与条件，未读到或读取失败时保持隐藏文案
  useEffect(() => {
    if (own) return;
    let active = true;
    setViewerTitles([]);
    void loadViewerTitles(viewerId).then(titles => { if (active) setViewerTitles(titles); }).catch(() => {});
    return () => { active = false; };
  },[own,viewerId,loadViewerTitles]);
  return <PlayerProfileCard player={player} view={view} error={error} onRetry={() => setAttempt(value => value+1)} onClose={onClose}
    viewerTitles={own ? view?.unlockedTitles ?? [] : viewerTitles} own={own} likes={likes} onLike={() => void likes.like()}
    onLikesRetry={() => { void (likes.error === 'send' ? likes.like() : likes.refresh()); }} />;
}
