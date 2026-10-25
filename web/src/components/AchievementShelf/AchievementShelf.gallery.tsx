import { useState } from 'react';
import type { AchievementId, AchievementView } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENTS } from '../../game/achievementRules';
import { AchievementShelf } from './AchievementShelf';
const noop = () => {};
// 与服务端一致：隐藏称号 hotpot 固定排最后，未解锁时是不带进度的占位（界面显示「隐藏称号」+ 灰蒙层）
const sample = (count: number): AchievementView => ({ equippedTitle:count?'cats':null, achievements:[...ACHIEVEMENTS.map((a,i)=>({ id:a.id, target:typeof a.target==='number'?a.target:80, current:i<count?(typeof a.target==='number'?a.target:80):0, unlockedAt:i<count?'2026-10-24T00:00:00Z':null })), { id:'hotpot' as const, target:1, current:0, unlockedAt:null }] });
function Live({ count=3, equipped }: { count?:number; equipped?:AchievementId }) { const [view,setView]=useState(()=>({ ...sample(count), ...(equipped ? { equippedTitle:equipped } : {}) })); return <AchievementShelf inline view={view} failed={false} saving={false} saveFailed={false} onRetry={noop} onClose={noop} onSelect={(id:AchievementId|null)=>setView(v=>({...v,equippedTitle:id}))} />; }
const entry: GalleryEntry = {name:'AchievementShelf', group:'components', states:{
  'v5 · phone preview':()=> <div style={{ margin: '-24px -16px' }}><Live count={7} equipped="album" /></div>,
  'legendary equipped · rainbow':()=> <Live count={7} equipped="album" />,
  'hidden hotpot unlocked · mythic (镇店之宝) equipped':()=> { const [view,setView]=useState<AchievementView>(()=>({ equippedTitle:'hotpot', achievements:[...sample(7).achievements.slice(0, 7),{ id:'hotpot', target:1, current:1, unlockedAt:'2026-10-25T00:00:00Z' }] })); return <AchievementShelf inline view={view} failed={false} saving={false} saveFailed={false} onRetry={noop} onClose={noop} onSelect={(id:AchievementId|null)=>setView(v=>({...v,equippedTitle:id}))} />; },
  'some unlocked · choose title':()=> <Live />,
  'all unlocked':()=> <Live count={7} />,
  'none unlocked':()=> <Live count={0} />,
  loading:()=> <AchievementShelf inline view={null} failed={false} saving={false} saveFailed={false} onRetry={noop} onClose={noop} onSelect={noop} />,
  'load failed':()=> <AchievementShelf inline view={null} failed saving={false} saveFailed={false} onRetry={noop} onClose={noop} onSelect={noop} />,
  'saving disabled':()=> <AchievementShelf inline view={sample(3)} failed={false} saving saveFailed={false} onRetry={noop} onClose={noop} onSelect={noop} />,
  'save failed':()=> <AchievementShelf inline view={sample(3)} failed={false} saving={false} saveFailed onRetry={noop} onClose={noop} onSelect={noop} />,
}}; export default entry;
