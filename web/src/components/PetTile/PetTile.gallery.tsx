import type { GalleryEntry } from '../../dev/gallery/types';
import { PLACEHOLDER_PETS } from '../../game/pets';
import { PetTile } from './PetTile';

const row = (size: number) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {PLACEHOLDER_PETS.map((pet, i) => (
      <div key={pet.id} style={{ width: size, height: size }}>
        <PetTile pet={pet} tint={i} size={size} />
      </div>
    ))}
  </div>
);

const entry: GalleryEntry = {
  name: 'PetTile',
  group: 'components',
  states: {
    'board size (48)': () => row(48),
    'lineup size (96)': () => row(56),
  },
};

export default entry;
