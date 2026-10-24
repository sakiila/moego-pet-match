import type { GalleryEntry } from '../../dev/gallery/types';
import { BoardDateCaption } from './BoardDateCaption';

const entry: GalleryEntry = {
  name: 'BoardDateCaption',
  group: 'components',
  states: {
    'October 24': () => <BoardDateCaption date="2026-10-24" />,
    'January 5': () => <BoardDateCaption date="2026-01-05" />,
  },
};
export default entry;
