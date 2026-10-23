import type { GalleryEntry } from '../../dev/gallery/types';
import { CollectionProgress } from './CollectionProgress';

const entry: GalleryEntry = {
  name: 'CollectionProgress',
  group: 'components',
  states: {
    empty: () => <CollectionProgress collected={0} total={80} />,
    some: () => <CollectionProgress collected={6} total={80} />,
    complete: () => <CollectionProgress collected={80} total={80} />,
  },
};
export default entry;
