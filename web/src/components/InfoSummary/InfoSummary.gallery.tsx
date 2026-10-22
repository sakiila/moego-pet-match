import type { GalleryEntry } from '../../dev/gallery/types';
import { InfoSummary } from './InfoSummary';

const entry: GalleryEntry = { name: 'InfoSummary', group: 'components', states: { default: () => <InfoSummary /> } };
export default entry;
