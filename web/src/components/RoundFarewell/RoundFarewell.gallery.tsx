import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { PREVIEW_PREP_PETS } from '../../dev/prepPets';
import { SAMPLE_FISH } from '../../game/pets';
import { translate } from '../../i18n';
import { RoundFarewell } from './RoundFarewell';

const entry: GalleryEntry = {
  name: 'RoundFarewell',
  group: 'components',
  states: {
    'zero service': () => <RoundFarewell pets={[]} locale="zh" message={translate('zh', 'round.thanks')} />,
    'one pet': () => <RoundFarewell pets={PREVIEW_PREP_PETS.slice(0, 1)} locale="zh" message={translate('zh', 'round.thanks')} />,
    'three pets': () => <RoundFarewell pets={PREVIEW_PREP_PETS.slice(0, 3)} locale="zh" message={translate('zh', 'round.thanks')} />,
    'long pet name': () => <RoundFarewell pets={PREVIEW_PREP_PETS.slice(0, 3).map((pet) => ({ ...pet, name: `${pet.name} the Magnificent Groomer` }))} locale="zh" message={translate('zh', 'round.thanks')} />,
    English: () => <RoundFarewell pets={PREVIEW_PREP_PETS.slice(0, 3)} locale="en" message={translate('en', 'round.thanks')} />,
    fish: () => <FishFrame><RoundFarewell pets={SAMPLE_FISH.slice(0, 3)} mode="fish" locale="zh" message={translate('zh', 'round.thanks')} /></FishFrame>,
  },
};

export default entry;
