import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { PREVIEW_PREP_PETS } from '../../dev/prepPets';
import { SAMPLE_FISH, type PetInfo } from '../../game/pets';
import { TimeUpBanner } from './TimeUpBanner';

const preview = (pets: readonly PetInfo[], fish = false) => (
  <div style={{ position: 'relative', height: 'var(--closing-frame-height)', transform: 'translateZ(0)', overflow: 'hidden' }}>
    <TimeUpBanner pets={pets} mode={fish ? 'fish' : 'normal'} />
  </div>
);

const entry: GalleryEntry = {
  name: 'TimeUpBanner',
  group: 'components',
  states: {
    'zero service': () => preview([]),
    'one pet': () => preview(PREVIEW_PREP_PETS.slice(0, 1)),
    'three pets · 中文 / English': () => preview(PREVIEW_PREP_PETS.slice(0, 3)),
    'long pet name': () => preview(PREVIEW_PREP_PETS.slice(0, 3).map((pet) => ({ ...pet, name: `${pet.name} the Magnificent Groomer` }))),
    fish: () => <FishFrame>{preview(SAMPLE_FISH.slice(0, 3), true)}</FishFrame>,
  },
};

export default entry;
