import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { PLACEHOLDER_PETS, SAMPLE_FISH } from '../../game/pets';
import { LineupPanel } from './LineupPanel';

const entry: GalleryEntry = {
  name: 'LineupPanel',
  group: 'components',
  states: {
    'six pets': () => <LineupPanel pets={PLACEHOLDER_PETS} />,
    'fish · six colors': () => (
      <FishFrame>
        <LineupPanel pets={SAMPLE_FISH} mode="fish" />
      </FishFrame>
    ),
    'long names': () => (
      <LineupPanel pets={PLACEHOLDER_PETS.map((p, i) => (i % 2 ? { ...p, name: `${p.name} the Magnificent Groomer` } : p))} />
    ),
  },
};

export default entry;
