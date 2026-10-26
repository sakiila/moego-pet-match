import type { GalleryEntry } from '../../dev/gallery/types';
import { playerPetCards } from '../../dev/gallery/playerPets';
import { PlayerPets, type PlayerPetsProps } from './PlayerPets';

const noop = () => {};
const render = (props: Partial<PlayerPetsProps> = {}) => <PlayerPets pets={playerPetCards} onOpen={noop} onRetry={noop} {...props} />;
const entry: GalleryEntry = { name: 'PlayerPets', group: 'components', states: {
  'collected + uncollected': () => render(),
  'own · uncollected full portrait': () => render({ own: true }),
  'single pet': () => render({ pets: playerPetCards.slice(0, 1) }),
  'many pets + long English name': () => render({ pets: [...playerPetCards, ...playerPetCards.map((pet, i) => ({ ...pet, petId: `long-${i}`, name: 'Sir Fluffington the Third of Shanghai' }))] }),
  loading: () => render({ pets: null }),
  empty: () => render({ pets: [] }),
  error: () => render({ pets: null, error: true }),
} };
export default entry;
