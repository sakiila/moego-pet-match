import type { GalleryEntry } from '../../dev/gallery/types';
import { RulesCard } from './RulesCard';

const entry: GalleryEntry = {
  name: 'RulesCard',
  group: 'components',
  states: { default: () => <RulesCard /> },
};

export default entry;
