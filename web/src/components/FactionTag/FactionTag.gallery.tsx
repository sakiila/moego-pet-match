import type { GalleryEntry } from '../../dev/gallery/types';
import { FactionTag } from './FactionTag';

const entry: GalleryEntry = {
  name: 'FactionTag',
  group: 'components',
  states: {
    'cat +46': () => <FactionTag contribution={{ faction: 'cat', points: 46, capped: false }} />,
    'dog +128': () => <FactionTag contribution={{ faction: 'dog', points: 128, capped: false }} />,
    'zero points': () => <FactionTag contribution={{ faction: 'cat', points: 0, capped: false }} />,
    'capped for today': () => <FactionTag contribution={{ faction: 'dog', points: 0, capped: true }} />,
  },
};
export default entry;
