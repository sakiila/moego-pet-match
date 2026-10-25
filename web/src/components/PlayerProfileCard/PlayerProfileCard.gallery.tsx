import type { PlayerProfileView } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_IDS } from '../../game/achievementRules';
import { PlayerProfileCard } from './PlayerProfileCard';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';

const noop = () => {};
const view: PlayerProfileView = {
  userId:'U_TEST_ALICE',name:'Alice Chen',mode:'normal',bestScore:13770,completedGames:12,
  collection:{collected:18,total:80},equippedTitle:'friends',unlockedTitles:['cats','dogs','friends'],
  recentGames:[13770,12480,11960,10840,9620].map((score,i)=>({gameId:`example-${i}`,completedAt:new Date(Date.UTC(2026,9,24-Math.floor(i/2),8)).toISOString(),score,newCollected:[3,1,0,2,0][i]})),
};
const render = (value: PlayerProfileView | null = view, error?: 'not_found' | 'unavailable') => <PlayerProfileCard inline player={value ?? view} view={value} error={error} onRetry={noop} onClose={noop} />;
function ModalPreview() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return <>
    <Button onClick={() => setOpen(true)}>{t('profile.open', { playerName: view.name })}</Button>
    {open && createPortal(<PlayerProfileCard player={view} view={{...view,unlockedTitles:[...ACHIEVEMENT_IDS]}} onRetry={noop} onClose={() => setOpen(false)} />, document.body)}
  </>;
}
const entry: GalleryEntry = {name:'PlayerProfileCard',group:'components',states:{
  'modal · hover / touch / Escape': () => <ModalPreview />,
  'default · latest rarity':()=>render(),
  'all badges':()=>render({...view,equippedTitle:'album',unlockedTitles:[...ACHIEVEMENT_IDS]}),
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
