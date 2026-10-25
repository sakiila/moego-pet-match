import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_RARITY_ORDER } from '../../game/achievementRarity';
import { RarityGuide } from './RarityGuide';

const entry: GalleryEntry = { name: 'RarityGuide', group: 'components', states: {
  'default · zh / en · narrow screen wraps': () => <RarityGuide rarities={ACHIEVEMENT_RARITY_ORDER} />,
  'empty (hidden)': () => <RarityGuide rarities={[]} />,
} };
export default entry;
