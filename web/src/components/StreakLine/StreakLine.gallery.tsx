import type { GalleryEntry } from '../../dev/gallery/types';
import { StreakLine } from './StreakLine';

const entry: GalleryEntry = {
  name: 'StreakLine',
  group: 'components',
  states: {
    'active: 3 days, clocked in today': () => <StreakLine streak={{ days: 3, today: true }} />,
    'pending: 3 days, not yet today': () => <StreakLine streak={{ days: 3, today: false }} />,
    'first day today': () => <StreakLine streak={{ days: 1, today: true }} />,
    'none (0 days)': () => <StreakLine streak={{ days: 0, today: false }} />,
    'long streak (365)': () => <StreakLine streak={{ days: 365, today: true }} />,
  },
};
export default entry;
