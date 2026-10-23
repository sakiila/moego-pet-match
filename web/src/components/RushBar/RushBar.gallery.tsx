import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { RushBar } from './RushBar';

const entry: GalleryEntry = {
  name: 'RushBar',
  group: 'components',
  states: {
    'hidden (reserves space)': () => <RushBar view={{ state: 'hidden' }} />,
    'active 0/12': () => <RushBar view={{ state: 'active', served: 0, secondsLeft: 20 }} />,
    'active 7/12': () => <RushBar view={{ state: 'active', served: 7, secondsLeft: 8 }} />,
    'active last second': () => <RushBar view={{ state: 'active', served: 11, secondsLeft: 1 }} />,
    success: () => <RushBar view={{ state: 'success' }} />,
    expired: () => <RushBar view={{ state: 'expired' }} />,
    'fish · active 6/12 · success · expired': () => (
      <FishFrame>
        <RushBar mode="fish" view={{ state: 'active', served: 6, secondsLeft: 8 }} />
        <RushBar mode="fish" view={{ state: 'success' }} />
        <RushBar mode="fish" view={{ state: 'expired' }} />
      </FishFrame>
    ),
  },
};

export default entry;
