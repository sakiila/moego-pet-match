import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_RARITY_ORDER } from '../../game/achievementRarity';
import { RarityTag } from './RarityTag';

const entry: GalleryEntry = { name: 'RarityTag', group: 'components', states: {
  'all tiers · zh / en': () => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>{ACHIEVEMENT_RARITY_ORDER.map(rarity => <RarityTag key={rarity} rarity={rarity} />)}</div>,
  'compact guide labels': () => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>{ACHIEVEMENT_RARITY_ORDER.map(rarity => <RarityTag key={rarity} rarity={rarity} compact />)}</div>,
  'mythic · 3s loop regardless of unlock status': () => <RarityTag rarity="mythic" />,
} };
export default entry;
