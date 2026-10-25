import type { GalleryEntry } from '../../dev/gallery/types';
import { PLACEHOLDER_PETS } from '../../game/pets';
import { ReportHarvest } from './ReportHarvest';

const noop = () => {};
const real = ['pet_b05057985e11', 'pet_7104fa8cdaea', 'pet_01714a23d2b5'].map((id, i) => ({
  pet: { id, name: ['Deedee', 'Banjo', 'Zuko'][i], imageBase: `/img/pets/${id}`, emoji: '🐾' },
  kind: i,
}));

const entry: GalleryEntry = {
  name: 'ReportHarvest',
  group: 'components',
  states: {
    'one new title first, then two pets': () => <ReportHarvest pets={real.slice(0, 2)} achievements={['dogs']} onSelectPet={noop} onOpenTitles={noop} />,
    'one pet only': () => <ReportHarvest pets={real.slice(0, 1)} onSelectPet={noop} />,
    'titles only (two)': () => <ReportHarvest pets={[]} achievements={['cats', 'album']} onOpenTitles={noop} />,
    'five items wrap to two rows': () => <ReportHarvest pets={real} achievements={['cats', 'friends']} onSelectPet={noop} onOpenTitles={noop} />,
    'placeholder six, not clickable': () => <ReportHarvest pets={PLACEHOLDER_PETS.map((pet, kind) => ({ pet, kind }))} />,
    'none (renders nothing)': () => <ReportHarvest pets={[]} />,
  },
};
export default entry;
