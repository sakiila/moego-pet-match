import type { GalleryEntry } from '../dev/gallery/types';
import { HomeScreen } from './HomeScreen';

const noop = () => {};
const player = (best: number | null) => ({
  userId: 'U_TEST_BOB',
  name: 'Bob',
  best: { normal: best, fish: null },
  progress: { completedNormalGames: 0, fishUnlocked: false },
});

const manager = { date: '2026-10-23', pet: { petId: 'pet_4750baaed3f0', name: 'Sanxian' } };

const entry: GalleryEntry = {
  name: 'HomeScreen',
  group: 'screens',
  states: {
    'first visit': () => <HomeScreen player={player(null)} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onSwitchIdentity={noop} />,
    'with record': () => <HomeScreen player={player(2480)} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onSwitchIdentity={noop} />,
    'manager unavailable': () => <HomeScreen player={player(2480)} manager={null} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onSwitchIdentity={noop} />,
  },
};

export default entry;
