import type { GalleryEntry } from '../../dev/gallery/types';
import { MyPetCard } from './MyPetCard';

const noop = () => {};
const card = (over: Partial<Parameters<typeof MyPetCard>[0]> = {}) => (
  <div style={{ maxWidth: 390 }}>
    <MyPetCard name="Maodu" stickerSrc="/img/pets/pet_644053d683e0/512" collected request={null} onView={noop} onRequestRemoval={noop} {...over} />
  </div>
);

const entry: GalleryEntry = {
  name: 'MyPetCard',
  group: 'components',
  states: {
    collected: () => card(),
    'not collected (hint)': () => card({ name: 'Boluo', stickerSrc: '/img/pets/pet_2f55c03f6968/512', collected: false }),
    'removal pending': () => card({ request: 'pending' }),
    'removal processed': () => card({ request: 'processed' }),
    'long name · image error': () => card({ name: 'Sir Fluffington the Third', stickerSrc: '/missing.png', collected: false }),
  },
};
export default entry;
