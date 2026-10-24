import type { GalleryEntry } from '../dev/gallery/types';
import { PREVIEW_PREP_PETS } from '../dev/prepPets';
import { SAMPLE_FISH } from '../game/pets';
import { PrepScreen } from './PrepScreen';

const noop = () => {};
const entry: GalleryEntry = {
  name: 'PrepScreen',
  group: 'screens',
  states: {
    'ready · reference lineup': () => <PrepScreen pets={PREVIEW_PREP_PETS} ownPetNames={['Maodu']} onStart={noop} onBack={noop} />,
    'ready · no own pet': () => <PrepScreen pets={PREVIEW_PREP_PETS} onStart={noop} onBack={noop} />,
    'long names · two own pets': () => <PrepScreen pets={PREVIEW_PREP_PETS.map((p, i) => i === 1 ? { ...p, name: 'Sir Fluffington the Magnificent' } : p)} ownPetNames={['Sir Fluffington the Magnificent', 'Boluo']} onStart={noop} onBack={noop} />,
    loading: () => <PrepScreen pets={null} onStart={noop} onBack={noop} />,
    failed: () => <PrepScreen pets={null} failed onRetry={noop} onStart={noop} onBack={noop} />,
    fish: () => <PrepScreen pets={SAMPLE_FISH} mode="fish" onStart={noop} onBack={noop} />,
  },
};
export default entry;
