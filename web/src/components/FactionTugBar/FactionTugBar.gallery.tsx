import type { GalleryEntry } from '../../dev/gallery/types';
import { FactionTugBar } from './FactionTugBar';

const live = (cat: number, dog: number) => ({ cat: { adjusted: cat }, dog: { adjusted: dog } });
const fog = { cat: { adjusted: null }, dog: { adjusted: null } };

const entry: GalleryEntry = {
  name: 'FactionTugBar',
  group: 'components',
  states: {
    'cat slightly ahead': () => <FactionTugBar sides={live(12480, 11760)} lead={{ leader: 'cat', level: 'slight' }} />,
    'dog well ahead': () => <FactionTugBar sides={live(3200, 9800)} lead={{ leader: 'dog', level: 'clear' }} />,
    'empty (no scores yet)': () => <FactionTugBar sides={live(0, 0)} lead={{ leader: null, level: 'even' }} />,
    'fog · even': () => <FactionTugBar sides={fog} lead={{ leader: null, level: 'even' }} />,
    'fog · dog slight': () => <FactionTugBar sides={fog} lead={{ leader: 'dog', level: 'slight' }} />,
    'compact': () => <FactionTugBar compact sides={live(52310, 48890)} lead={{ leader: 'cat', level: 'slight' }} />,
    'huge numbers': () => <FactionTugBar sides={live(1234567, 1198765)} lead={{ leader: 'cat', level: 'slight' }} />,
  },
};
export default entry;
