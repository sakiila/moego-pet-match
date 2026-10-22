import type { GalleryEntry } from '../../dev/gallery/types';
import { PLACEHOLDER_PETS } from '../../game/pets';
import { LineupPanel } from './LineupPanel';

const entry: GalleryEntry = {
  name: 'LineupPanel',
  group: 'components',
  states: {
    'six pets': () => <LineupPanel pets={PLACEHOLDER_PETS} />,
    'long names': () => (
      <LineupPanel pets={PLACEHOLDER_PETS.map((p, i) => (i % 2 ? { ...p, name: `${p.name} the Magnificent Groomer` } : p))} />
    ),
  },
};

export default entry;
