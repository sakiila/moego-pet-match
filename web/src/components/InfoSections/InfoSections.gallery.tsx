import type { GalleryEntry } from '../../dev/gallery/types';
import { InfoSections } from './InfoSections';

const entry: GalleryEntry = {
  name: 'InfoSections',
  group: 'components',
  states: { 'with player': () => <InfoSections playerName="Bob 包博" />, 'no player selected (no consent line)': () => <InfoSections playerName={null} /> },
};
export default entry;
