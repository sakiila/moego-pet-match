import type { PlayerProfileView } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_IDS } from '../../game/achievementRules';
import { PlayerProfileCard } from './PlayerProfileCard';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import type { PlayerLikesState } from '../../game/playerLikes';
import { PlayerPets } from '../PlayerPets/PlayerPets';
import { PlayerProfileOverlay } from '../../screens/PlayerProfileOverlay';
import { loadPlayerPetDetailPreview, loadPlayerPetsPreview, playerPetCards } from '../../dev/gallery/playerPets';

const noop = () => {};
const likes: PlayerLikesState = { view: { receivedLikes: 12, likedByViewer: false, canLike: true }, loading: false, sending: false, error: null, celebration: 0 };
const view: PlayerProfileView = {
  userId:'U_TEST_ALICE',name:'Alice Chen',mode:'normal',bestScore:13770,completedGames:12,
  collection:{collected:18,total:80},equippedTitle:'friends',unlockedTitles:['cats','dogs','friends'],
  recentGames:[13770,12480,11960,10840,9620].map((score,i)=>({gameId:`example-${i}`,completedAt:new Date(Date.UTC(2026,9,24-Math.floor(i/2),8)).toISOString(),score,newCollected:[3,1,0,2,0][i]})),
};
const petsPreview = <PlayerPets pets={playerPetCards} onOpen={noop} onRetry={noop} />;
const render = (value: PlayerProfileView | null = view, error?: 'not_found' | 'unavailable') => <PlayerProfileCard inline player={value ?? view} view={value} error={error} onRetry={noop} onClose={noop} likes={likes} onLike={noop} onLikesRetry={noop} pets={petsPreview} />;
const bob = { ...view, userId: 'U_TEST_BOB', name: 'Bob' };
const loadProfilePreview = async () => bob;
const loadLikesPreview = async () => likes.view!;
const loadTitlesPreview = async () => [];
function ModalPreview({ own = false }: { own?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return <>
    <Button onClick={() => setOpen(true)}>{t('profile.open', { playerName: bob.name })}</Button>
    {open && createPortal(<PlayerProfileOverlay player={bob} viewerId={own ? bob.userId : 'U_TEST_ALICE'} mode="normal"
      load={loadProfilePreview} loadLikes={loadLikesPreview} loadViewerTitles={loadTitlesPreview}
      loadPets={loadPlayerPetsPreview} loadPetDetail={loadPlayerPetDetailPreview} onOpenShop={() => setOpen(false)} onClose={() => setOpen(false)} />, document.body)}
  </>;
}
const entry: GalleryEntry = {name:'PlayerProfileCard',group:'components',states:{
  'modal · hover / touch / Escape': () => <ModalPreview />,
  'own modal · uncollected portrait / flip': () => <ModalPreview own />,
  'default · latest rarity':()=>render(),
  'liked · permanent': () => <PlayerProfileCard inline player={view} view={view} likes={{ ...likes, view: { receivedLikes: 13, likedByViewer: true, canLike: false } }} onRetry={noop} onClose={noop} />,
  'own · read only': () => <PlayerProfileCard inline player={view} view={view} own likes={{ ...likes, view: { ...likes.view!, canLike: false } }} onRetry={noop} onClose={noop} />,
  'likes unavailable · profile remains visible': () => <PlayerProfileCard inline player={view} view={view} likes={{ ...likes, view: null, error: 'load' }} onLikesRetry={noop} onRetry={noop} onClose={noop} />,
  'all badges · viewer has not unlocked hotpot (meow)':()=>render({...view,equippedTitle:'hotpot',unlockedTitles:[...ACHIEVEMENT_IDS]}),
  'all badges · viewer unlocked hotpot':()=><PlayerProfileCard inline player={view} view={{...view,equippedTitle:'hotpot',unlockedTitles:[...ACHIEVEMENT_IDS]}} viewerTitles={['hotpot']} onRetry={noop} onClose={noop} />,
  'empty':()=>render({...view,bestScore:null,completedGames:0,equippedTitle:null,unlockedTitles:[],recentGames:[],collection:{collected:0,total:80}}),
  loading:()=>render(null),
  'load failed':()=>render(null,'unavailable'),
  'not available':()=>render(null,'not_found'),
  'long English name + large score':()=>render({...view,name:'Alexandria Catherine Montgomery-Wellington',bestScore:1234567}),
  fish:()=>render({...view,mode:'fish',bestScore:19000}),
}};
export default entry;
import { useState } from 'react';
import { createPortal } from 'react-dom';
