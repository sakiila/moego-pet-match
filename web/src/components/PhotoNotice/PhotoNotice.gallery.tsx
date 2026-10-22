import type { GalleryEntry } from '../../dev/gallery/types';
import { PhotoNotice } from './PhotoNotice';

const entry: GalleryEntry = { name: 'PhotoNotice', group: 'components', states: { default: () => <PhotoNotice /> } };
export default entry;
