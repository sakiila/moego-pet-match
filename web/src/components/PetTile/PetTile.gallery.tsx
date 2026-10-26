import type { GalleryEntry } from '../../dev/gallery/types';
import { PLACEHOLDER_PETS, type PetInfo } from '../../game/pets';
import { PetTile } from './PetTile';

/** 开发库中的真实宠物（需本地 server 与已 publish 的名录）。 */
const REAL: PetInfo[] = ['pet_b05057985e11', 'pet_7104fa8cdaea', 'pet_01714a23d2b5'].map((id) => ({ id, name: id, imageBase: `/img/pets/${id}`, emoji: '🐾' }));
const FISH: PetInfo[] = ['red', 'blue', 'yellow'].map((c) => ({ id: c, name: c, imageBase: `/img/fish/fish_color_${c}`, emoji: '🐟' }));

const row = (pets: PetInfo[], size: number) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {pets.map((pet, i) => (
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
    'roster portrait': () => <div style={{ width: 96, height: 96 }}><PetTile pet={REAL[0]} tint={0} size={120} variant="portrait" /></div>,
    'portrait · small image, upgrade deferred': () => <div style={{ width: 96, height: 96 }}><PetTile pet={REAL[0]} tint={0} size={120} variant="portrait" highResolution={false} /></div>,
    'large tile · small image, upgrade deferred': () => <div style={{ width: 96, height: 96 }}><PetTile pet={REAL[0]} tint={0} size={96} highResolution={false} /></div>,
    'placeholder (48)': () => row(PLACEHOLDER_PETS, 48),
    'real stickers (48)': () => row(REAL, 48),
    'real stickers (96)': () => row(REAL, 96),
    'fish colors (48)': () => row(FISH, 48),
    'missing image → fallback': () => row([{ id: 'x', name: 'Missing', imageBase: '/img/pets/nope', emoji: '🐾' }], 48),
  },
};

export default entry;
