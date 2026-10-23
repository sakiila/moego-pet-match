import type { GalleryEntry } from '../../dev/gallery/types';
import { LeaveDialog } from './LeaveDialog';

const entry: GalleryEntry = {
  name: 'LeaveDialog',
  group: 'components',
  states: { default: () => <LeaveDialog open inline onStay={() => {}} onLeave={() => {}} /> },
};
export default entry;
