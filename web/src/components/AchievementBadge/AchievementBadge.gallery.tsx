import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_DISPLAY_ORDER } from '../../game/achievementRarity';
import { AchievementBadge } from './AchievementBadge';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';
const entry: GalleryEntry = { name:'AchievementBadge', group:'components', states: {
  'rarity showcase · all seven': () => <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>{ACHIEVEMENT_DISPLAY_ORDER.map(id=><AchievementBadge key={id} id={id} large rarity />)}</div>,
  'rarity showcase · locked': () => <AchievementBadge id="album" large locked rarity />,
  'all badges': () => <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>{ACHIEVEMENT_DISPLAY_ORDER.map(id=><AchievementBadge key={id} id={id} large />)}</div>,
  'title chips · zh / en': () => <div style={{ display:'grid', gap:12 }}>{ACHIEVEMENT_DISPLAY_ORDER.map(id=><AchievementBadge key={id} id={id} chip />)}</div>,
  'locked': () => <AchievementBadge id="cats" locked large />,
  'aurora motion · 6s loop': () => <AchievementBadge id="hotpot" size={160} />,
  'unrevealed name · earned badge stays visible': () => <AchievementBadge id="hotpot" chip revealed={false} />,
  'hotpot · unified showcase across sizes': () => <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}><AchievementAvatar name="Bob" equippedTitle="hotpot" /><AchievementBadge id="hotpot" rarity={false} /><AchievementBadge id="hotpot" chip /><AchievementBadge id="hotpot" size={56} /><AchievementBadge id="hotpot" large /></div>,
  'hidden (locked hotpot · mask + ?)': () => <div style={{ display:'flex', gap:16 }}><AchievementBadge id="hotpot" locked hidden large rarity /><AchievementBadge id="hotpot" locked hidden size={56} rarity /></div>,
}}; export default entry;
