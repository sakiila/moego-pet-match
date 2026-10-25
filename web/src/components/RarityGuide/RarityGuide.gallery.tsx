import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_RARITY_ORDER } from '../../game/achievementRarity';
import { RarityGuide } from './RarityGuide';

const entry: GalleryEntry = { name: 'RarityGuide', group: 'components', states: {
  'gradient rail · zh / en · responsive': () => <RarityGuide rarities={ACHIEVEMENT_RARITY_ORDER} />,
  'single tier': () => <RarityGuide rarities={['mythic']} />,
  'empty (hidden)': () => <RarityGuide rarities={[]} />,
} };
export default entry;
