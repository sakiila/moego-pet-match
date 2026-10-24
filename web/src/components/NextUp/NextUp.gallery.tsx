import type { GalleryEntry } from '../../dev/gallery/types';
import { NextUp } from './NextUp';

const oreo = { name: 'Oreo', src: '/img/pets/pet_b05057985e11/512' };
const noop = () => {};

const entry: GalleryEntry = {
  name: 'NextUp',
  group: 'components',
  states: {
    'achievement: cats, 2 to go (with speaker)': () => <NextUp nextUp={{ kind: 'achievement', id: 'cats', remaining: 2 }} speaker={oreo} onOpenCollection={noop} />,
    'achievement: album, last 3': () => <NextUp nextUp={{ kind: 'achievement', id: 'album', remaining: 3 }} speaker={oreo} onOpenCollection={noop} />,
    'milestone: 50%, 4 to go': () => <NextUp nextUp={{ kind: 'milestone', percent: 50, remaining: 4 }} speaker={oreo} onOpenCollection={noop} />,
    'fish: 1 round left': () => <NextUp nextUp={{ kind: 'fish', rounds: 1 }} speaker={oreo} />,
    'fish: 2 rounds left': () => <NextUp nextUp={{ kind: 'fish', rounds: 2 }} speaker={oreo} />,
    'tomorrow (fallback)': () => <NextUp nextUp={{ kind: 'tomorrow' }} speaker={oreo} />,
    'no speaker (zero service)': () => <NextUp nextUp={{ kind: 'tomorrow' }} />,
    'no collection action handler': () => <NextUp nextUp={{ kind: 'achievement', id: 'dogs', remaining: 1 }} speaker={oreo} />,
  },
};
export default entry;
