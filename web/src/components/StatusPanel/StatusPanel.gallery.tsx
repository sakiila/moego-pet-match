import type { GalleryEntry } from '../../dev/gallery/types';
import { StatusPanel } from './StatusPanel';

const entry: GalleryEntry = {
  name: 'StatusPanel',
  group: 'components',
  states: {
    'start (90 s)': () => <StatusPanel timeLeftMs={90_000} score={0} />,
    'mid round': () => <StatusPanel timeLeftMs={48_000} score={2480} />,
    'last 10 s': () => <StatusPanel timeLeftMs={7_200} score={12_340} />,
    'time up': () => <StatusPanel timeLeftMs={0} score={99_999} />,
  },
};

export default entry;
