import type { GalleryEntry } from '../../dev/gallery/types';
import { BrandHeader } from './BrandHeader';

const entry: GalleryEntry = {
  name: 'BrandHeader',
  group: 'components',
  states: {
    'with tagline (board)': () => <BrandHeader tagline />,
    'title only (prep)': () => <BrandHeader />,
  },
};

export default entry;
