import type { CollectionView, PetDetail } from '../api/types';
import type { GalleryEntry } from '../dev/gallery/types';
import { PetdexScreen } from './PetdexScreen';

const noop = () => {};
const player = { userId: 'U_TEST_BOB', name: 'Bob', best: { normal: 2480, fish: null }, progress: { completedNormalGames: 3, fishUnlocked: true } };
const ids = ['pet_4750baaed3f0', 'pet_b05057985e11', 'pet_7104fa8cdaea', 'pet_01714a23d2b5', 'pet_c7ad902c2024'];
const names = ['Sanxian', 'Deedee', 'Banjo', 'Zuko', '7-Eleven'];
const view = (collectedCount: number): CollectionView => ({
  total: ids.length,
  collected: collectedCount,
  pets: ids.map((petId, i) => ({
    petId,
    name: names[i],
    collected: i < collectedCount,
    collectedAt: i < collectedCount ? `2026-10-2${i}T00:00:00Z` : null,
    owner: i < collectedCount ? { userId: 'U_TEST_ALICE', name: 'Alice Chen' } : null,
    own: false,
  })),
});
const detail = async (petId: string): Promise<PetDetail> => ({
  petId,
  name: names[ids.indexOf(petId)],
  collected: ids.indexOf(petId) < 3,
  own: false,
  owner: { userId: 'U_TEST_ALICE', name: 'Alice Chen' },
  quote: 'Loves naps. Hates baths! Will trade anything for cheese.',
  hasPhoto: true,
  listed: true,
});

const entry: GalleryEntry = {
  name: 'PetdexScreen',
  group: 'screens',
  states: {
    'some collected': () => <PetdexScreen player={player} onBack={noop} onOpenShop={noop} onUpload={noop} load={async () => view(3)} loadDetail={detail} />,
    'none collected': () => <PetdexScreen player={player} onBack={noop} onOpenShop={noop} onUpload={noop} load={async () => view(0)} loadDetail={detail} />,
    'load failed': () => <PetdexScreen player={player} onBack={noop} onOpenShop={noop} onUpload={noop} load={() => Promise.reject(new Error('x'))} loadDetail={detail} />,
  },
};
export default entry;
