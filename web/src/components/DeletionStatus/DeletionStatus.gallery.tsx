import type { GalleryEntry } from '../../dev/gallery/types';
import { DeletionStatus } from './DeletionStatus';

const entry: GalleryEntry = {
  name: 'DeletionStatus',
  group: 'components',
  states: { pending: () => <DeletionStatus status="pending" />, processed: () => <DeletionStatus status="processed" />, 'with pet label': () => <DeletionStatus status="pending" label="Sir Fluffington the Third" /> },
};
export default entry;
