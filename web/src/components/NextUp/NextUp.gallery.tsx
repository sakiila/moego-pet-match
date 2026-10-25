import type { GalleryEntry } from '../../dev/gallery/types';
import { NextUp } from './NextUp';

const oreo = { name: 'Oreo', src: '/img/pets/pet_b05057985e11/512' };

const entry: GalleryEntry = {
  name: 'NextUp',
  group: 'components',
  states: {
    'achievement: cats, 2 to go (with speaker)': () => <NextUp nextUp={{ kind: 'achievement', id: 'cats', remaining: 2 }} speaker={oreo} />,
    'achievement: neighbors, 1 to go': () => <NextUp nextUp={{ kind: 'achievement', id: 'neighbors', remaining: 1 }} speaker={oreo} />,
    'achievement: album, last 3': () => <NextUp nextUp={{ kind: 'achievement', id: 'album', remaining: 3 }} speaker={oreo} />,
    'milestone: 50%, 4 to go': () => <NextUp nextUp={{ kind: 'milestone', percent: 50, remaining: 4 }} speaker={oreo} />,
    'fish: 1 round left': () => <NextUp nextUp={{ kind: 'fish', rounds: 1 }} speaker={oreo} />,
    'fish: 2 rounds left': () => <NextUp nextUp={{ kind: 'fish', rounds: 2 }} speaker={oreo} />,
    'tomorrow (fallback)': () => <NextUp nextUp={{ kind: 'tomorrow' }} speaker={oreo} />,
    'no speaker (zero service, no manager)': () => <NextUp nextUp={{ kind: 'tomorrow' }} />,
  },
};
export default entry;
