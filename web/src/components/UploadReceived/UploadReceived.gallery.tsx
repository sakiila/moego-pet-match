import type { GalleryEntry } from '../../dev/gallery/types';
import { UploadReceived } from './UploadReceived';

const entry: GalleryEntry = {
  name: 'UploadReceived',
  group: 'components',
  states: {
    default: () => <UploadReceived petName="Oreo" onPlay={() => {}} onHome={() => {}} />,
    'long name': () => <UploadReceived petName="Sir Fluffington the Third of Shanghai" onPlay={() => {}} onHome={() => {}} />,
  },
};
export default entry;
