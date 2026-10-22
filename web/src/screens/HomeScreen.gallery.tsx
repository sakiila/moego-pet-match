import type { GalleryEntry } from '../dev/gallery/types';
import { HomeScreen } from './HomeScreen';

const noop = () => {};
const player = (best: number | null) => ({
  userId: 'U_TEST_BOB',
  name: 'Bob',
  best: { normal: best, fish: null },
  progress: { completedNormalGames: 0, fishUnlocked: false },
});

const entry: GalleryEntry = {
  name: 'HomeScreen',
  group: 'screens',
  states: {
    'first visit': () => <HomeScreen player={player(null)} onOpenShop={noop} onLeaderboard={noop} onSwitchIdentity={noop} />,
    'with record': () => <HomeScreen player={player(2480)} onOpenShop={noop} onLeaderboard={noop} onSwitchIdentity={noop} />,
  },
};

export default entry;
