import { FishFrame } from '../../dev/gallery/FishFrame';
import { useState } from 'react';
import type { AchievementId } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_IDS } from '../../game/achievementRules';
import { AchievementUnlocks } from './AchievementUnlocks';
function Live({ids}:{ids:AchievementId[]}) { const [equipped,setEquipped]=useState<AchievementId|null>(null); return <AchievementUnlocks ids={ids} equippedTitle={equipped} onEquip={async id=>setEquipped(id)} />; }
const entry: GalleryEntry = {name:'AchievementUnlocks',group:'components',states:{
  'fish theme':()=> <FishFrame><Live ids={['cats','dogs']} /></FishFrame>,
  'one unlocked':()=> <Live ids={['cats']} />,
  'multiple unlocked':()=> <Live ids={[...ACHIEVEMENT_IDS]} />,
  'no new achievements':()=> <Live ids={[]} />,
  'equip failed':()=> <AchievementUnlocks ids={['cats']} onEquip={async()=>{throw new Error('offline');}} />,
}}; export default entry;
