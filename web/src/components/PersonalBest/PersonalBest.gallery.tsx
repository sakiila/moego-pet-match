import type { GalleryEntry } from '../../dev/gallery/types';
import { PersonalBest } from './PersonalBest';

const entry: GalleryEntry = {
  name: 'PersonalBest',
  group: 'components',
  states: { 'no record': () => <PersonalBest score={null} />, 'has record': () => <PersonalBest score={2480} />, 'saved zero': () => <PersonalBest score={0} /> },
};
export default entry;
