import type { GalleryEntry } from '../../dev/gallery/types';
import { PLACEHOLDER_PETS } from '../../game/pets';
import { NewCollection } from './NewCollection';

const entry: GalleryEntry = {
  name: 'NewCollection',
  group: 'components',
  states: {
    'two pets': () => <NewCollection pets={PLACEHOLDER_PETS.slice(0, 2)} />,
    'six pets': () => <NewCollection pets={PLACEHOLDER_PETS} />,
    'none (renders nothing)': () => <NewCollection pets={[]} />,
  },
};
export default entry;
