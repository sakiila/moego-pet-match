import type { GalleryEntry } from '../../dev/gallery/types';
import { InfoSections } from './InfoSections';

const entry: GalleryEntry = {
  name: 'InfoSections',
  group: 'components',
  states: { 'all six sections (before and after profile selection)': () => <InfoSections /> },
};
export default entry;
