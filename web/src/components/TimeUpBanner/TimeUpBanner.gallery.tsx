import type { GalleryEntry } from '../../dev/gallery/types';
import { TimeUpBanner } from './TimeUpBanner';

const entry: GalleryEntry = {
  name: 'TimeUpBanner',
  group: 'components',
  states: {
    默认: () => (
      <div style={{ position: 'relative', height: 160, transform: 'translateZ(0)', overflow: 'hidden' }}>
        <TimeUpBanner />
      </div>
    ),
  },
};

export default entry;
