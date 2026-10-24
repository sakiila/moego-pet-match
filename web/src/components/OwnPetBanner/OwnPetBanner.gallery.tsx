import type { GalleryEntry } from '../../dev/gallery/types';
import { OwnPetBanner } from './OwnPetBanner';

const entry: GalleryEntry = {
  name: 'OwnPetBanner',
  group: 'components',
  states: {
    'one own pet': () => <OwnPetBanner names={['Maodu']} />,
    'two own pets': () => <OwnPetBanner names={['Doujia', 'Anzai']} />,
    'long name, one line': () => <OwnPetBanner names={['Sir Fluffington the Magnificent', 'Boluo']} />,
    'none (renders nothing)': () => <OwnPetBanner names={[]} />,
  },
};
export default entry;
