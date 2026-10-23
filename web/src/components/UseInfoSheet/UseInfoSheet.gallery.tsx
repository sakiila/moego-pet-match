import type { GalleryEntry } from '../../dev/gallery/types';
import { UseInfoSheet } from './UseInfoSheet';

const entry: GalleryEntry = {
  name: 'UseInfoSheet',
  group: 'components',
  states: { 'photo use and processing': () => <UseInfoSheet open inline title="upload.use_title" body="upload.use_body" onClose={() => {}} /> },
};
export default entry;
