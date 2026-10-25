import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { BoardControls } from './BoardControls';
const noop = () => {};
export default {
  name: 'BoardControls',
  group: 'components',
  states: {
    default: () => <BoardControls onSettings={noop} onExit={noop} />,
    'time up': () => <BoardControls timeUp onSettings={noop} onExit={noop} />,
    fish: () => <FishFrame><BoardControls onSettings={noop} onExit={noop} /></FishFrame>,
  },
} satisfies GalleryEntry;

