import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_IDS } from '../../game/achievementRules';
import { AchievementBadge } from './AchievementBadge';
const entry: GalleryEntry = { name:'AchievementBadge', group:'components', states: {
  'rarity showcase · all seven': () => <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>{ACHIEVEMENT_IDS.map(id=><AchievementBadge key={id} id={id} large rarity />)}</div>,
  'rarity showcase · locked': () => <AchievementBadge id="album" large locked rarity />,
  'all badges': () => <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>{ACHIEVEMENT_IDS.map(id=><AchievementBadge key={id} id={id} large />)}</div>,
  'title chips · zh / en': () => <div style={{ display:'grid', gap:12 }}>{ACHIEVEMENT_IDS.map(id=><AchievementBadge key={id} id={id} chip />)}</div>,
  'locked': () => <AchievementBadge id="cats" locked large />,
}}; export default entry;
