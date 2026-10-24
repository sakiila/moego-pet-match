import type { GalleryEntry } from '../dev/gallery/types';
import { HomeScreen } from './HomeScreen';

const noop = () => {};
const player = (best: number | null) => ({
  userId: 'U_TEST_BOB',
  name: 'Bob',
  best: { normal: best, fish: null },
  progress: { completedNormalGames: 0, fishUnlocked: false }, streak: { days: 0, today: false },
});

const manager = { date: '2026-10-23', pet: { petId: 'pet_4750baaed3f0', name: 'Sanxian' } };

const entry: GalleryEntry = {
  name: 'HomeScreen',
  group: 'screens',
  states: {
    'equipped legendary · C size': () => <HomeScreen player={{ ...player(2480), equippedTitle: 'album' }} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} onTitles={noop} />,
    'first visit': () => <HomeScreen player={player(null)} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'streak 3 days, clocked in today': () => (
      <HomeScreen player={{ ...player(2480), streak: { days: 3, today: true } }} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />
    ),
    'streak 3 days, not yet today': () => (
      <HomeScreen player={{ ...player(2480), streak: { days: 3, today: false } }} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />
    ),
    'with record': () => <HomeScreen player={player(2480)} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'manager unavailable': () => <HomeScreen player={player(2480)} manager={null} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
  },
};

export default entry;
