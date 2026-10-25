import type { GalleryEntry } from '../../dev/gallery/types';
import { PhotoNotice } from './PhotoNotice';

const entry: GalleryEntry = {
  name: 'PhotoNotice',
  group: 'components',
  states: {
    default: () => <PhotoNotice />,
    'developer egg: Maodu + Boluo faces': () => <PhotoNotice faces={['/img/pets/pet_644053d683e0/128', '/img/pets/pet_2f55c03f6968/128']} />,
  },
};
export default entry;
