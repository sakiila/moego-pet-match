import type { GalleryEntry } from '../../dev/gallery/types';
import { PLACEHOLDER_PETS } from '../../game/pets';
import { CollectionCards } from './CollectionCards';

const real = ['pet_b05057985e11', 'pet_7104fa8cdaea', 'pet_01714a23d2b5'].map((id, i) => ({
  pet: { id, name: ['Deedee', 'Banjo', 'Zuko'][i], imageBase: `/img/pets/${id}`, emoji: '🐾' },
  kind: i,
}));

const entry: GalleryEntry = {
  name: 'CollectionCards',
  group: 'components',
  states: {
    'two (real)': () => <CollectionCards pets={real.slice(0, 2)} />,
    'three (real)': () => <CollectionCards pets={real} />,
    'placeholder six': () => <CollectionCards pets={PLACEHOLDER_PETS.map((pet, kind) => ({ pet, kind }))} />,
    'none (renders nothing)': () => <CollectionCards pets={[]} />,
  },
};
export default entry;
