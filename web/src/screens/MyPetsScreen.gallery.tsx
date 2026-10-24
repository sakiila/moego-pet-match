import type { MyPet, PetDetail } from '../api/types';
import type { GalleryEntry } from '../dev/gallery/types';
import { MyPetsScreen } from './MyPetsScreen';

const noop = () => {};
const player = { userId: 'U03FPQWGTN2', name: 'Bob 包博', best: { normal: 2480, fish: null }, progress: { completedNormalGames: 3, fishUnlocked: true } };
const two: MyPet[] = [
  { petId: 'pet_644053d683e0', name: 'Maodu', collected: true, request: null },
  { petId: 'pet_2f55c03f6968', name: 'Boluo', collected: false, request: null },
];
const detail = async (petId: string): Promise<PetDetail> => ({
  petId,
  name: two.find((p) => p.petId === petId)?.name ?? 'Maodu',
  collected: petId === two[0].petId,
  own: true,
  owner: { userId: 'U03FPQWGTN2', name: 'Bob 包博' },
  quote: 'Loves naps.',
  hasPhoto: true,
  listed: true,
  knownBy: { count: 4, recent: [{ userId: 'U_TEST_ALICE', name: 'Alice Chen' }, { userId: 'U_TEST_ZHANG', name: 'Zhang Wei(张伟)' }, { userId: 'U03FPQWGTN2', name: 'Bob 包博' }, { userId: 'U_TEST_SAM', name: 'Samantha Sullivan' }] },
});

const entry: GalleryEntry = {
  name: 'MyPetsScreen',
  group: 'screens',
  states: {
    'two pets (collected / not)': () => <MyPetsScreen player={player} onBack={noop} onUpload={noop} onOpenShop={noop} load={async () => two} loadDetail={detail} />,
    'removal pending': () => (
      <MyPetsScreen player={player} onBack={noop} onUpload={noop} onOpenShop={noop} load={async () => [{ ...two[0], request: { status: 'pending' } }, two[1]]} loadDetail={detail} />
    ),
    empty: () => <MyPetsScreen player={player} onBack={noop} onUpload={noop} onOpenShop={noop} load={async () => []} loadDetail={detail} />,
    'load failed': () => <MyPetsScreen player={player} onBack={noop} onUpload={noop} onOpenShop={noop} load={() => Promise.reject(new Error('x'))} loadDetail={detail} />,
  },
};
export default entry;
