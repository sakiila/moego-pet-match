import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { AchievementId, ColleagueResult, GameMode, PetDetail, PlayerPet, PlayerProfileView } from '../api/types';
import { PlayerProfileCard } from '../components/PlayerProfileCard/PlayerProfileCard';
import { PlayerPets } from '../components/PlayerPets/PlayerPets';
import { usePlayerLikes } from '../game/usePlayerLikes';
import { usePetDetail } from '../game/usePetDetail';
import { silhouetteUrl, stickerUrl } from '../game/pets';
import { PetDetailOverlay } from './PetDetailOverlay';
import type { PlayerLikesLoader, PlayerLikesSender } from '../game/playerLikes';

export type ProfileLoader = (playerId: string, mode: GameMode, signal?: AbortSignal) => Promise<PlayerProfileView>;
export type PlayerPetsLoader = (ownerId: string, viewerId: string, signal?: AbortSignal) => Promise<PlayerPet[]>;
/** 读取正在看名片的玩家自己已解锁的称号。 */
export type ViewerTitlesLoader = (playerId: string) => Promise<AchievementId[]>;

export const loadUnlockedTitles: ViewerTitlesLoader = (playerId) =>
  api.getAchievements(playerId).then((v) => v.achievements.filter((a) => a.unlockedAt).map((a) => a.id));

export function PlayerProfileOverlay({ player, viewerId, mode, onClose, onOpenShop, load = api.getPlayerProfile, loadViewerTitles = loadUnlockedTitles, loadLikes, sendLike, loadPets = api.getPlayerPets, loadPetDetail = api.getPetDetail }: {
  player: ColleagueResult; viewerId: string; mode: GameMode; onClose: () => void; load?: ProfileLoader; loadViewerTitles?: ViewerTitlesLoader;
  loadLikes?: PlayerLikesLoader; sendLike?: PlayerLikesSender;
  onOpenShop: () => void;
  loadPets?: PlayerPetsLoader;
  loadPetDetail?: (petId: string, playerId: string) => Promise<PetDetail>;
}) {
  const [view,setView] = useState<PlayerProfileView | null>(null);
  const [error,setError] = useState<'not_found' | 'unavailable' | null>(null);
  const [attempt,setAttempt] = useState(0);
  const [viewerTitles,setViewerTitles] = useState<AchievementId[]>([]);
  const [pets, setPets] = useState<PlayerPet[] | null>(null);
  const [petsError, setPetsError] = useState(false);
  const [petsAttempt, setPetsAttempt] = useState(0);
  const detail = usePetDetail(viewerId, loadPetDetail);
  const own = viewerId === player.userId;
  const likes = usePlayerLikes(player.userId, viewerId, loadLikes, sendLike);
  useEffect(() => {
    const controller = new AbortController();
    setPets(null); setPetsError(false);
    void loadPets(player.userId, viewerId, controller.signal).then(data => {
      if (!controller.signal.aborted) setPets(data);
    }).catch(() => {
      if (!controller.signal.aborted) setPetsError(true);
    });
    return () => controller.abort();
  }, [player.userId, viewerId, loadPets, petsAttempt]);
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
  return <>
    <PlayerProfileCard player={player} view={view} error={error} onRetry={() => setAttempt(value => value+1)} onClose={onClose}
      suspended={!!detail.open}
      pets={<PlayerPets own={own} error={petsError} pets={pets?.map(pet => ({ ...pet, stickerSrc: stickerUrl(pet.petId, 512), silhouetteSrc: silhouetteUrl(pet.petId, 512) })) ?? null}
        onRetry={() => setPetsAttempt(value => value + 1)} onOpen={detail.show} />}
      viewerTitles={own ? view?.unlockedTitles ?? [] : viewerTitles} own={own} likes={likes} onLike={() => void likes.like()}
      onLikesRetry={() => { void (likes.error === 'send' ? likes.like() : likes.refresh()); }} />
    <PetDetailOverlay pet={detail.open} playerId={viewerId} onClose={detail.close} onRetry={detail.show}
      aboveSheet allowRemoval={false} onOpenShop={onOpenShop} />
  </>;
}
