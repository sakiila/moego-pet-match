import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { RulesCard } from './RulesCard';

const entry: GalleryEntry = {
  name: 'RulesCard',
  group: 'components',
  states: {
    default: () => <RulesCard />,
    fish: () => (
      <FishFrame>
        <RulesCard mode="fish" />
      </FishFrame>
    ),
  },
};

export default entry;
