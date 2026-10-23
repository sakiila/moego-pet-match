import type { LeaderboardView } from '../api/types';
import type { GalleryEntry } from '../dev/gallery/types';
import { LeaderboardScreen } from './LeaderboardScreen';

const noop = () => {};
const player = (fishUnlocked: boolean) => ({
  userId: 'bob',
  name: 'Bob',
  best: { normal: 2480, fish: null },
  progress: { completedNormalGames: 3, fishUnlocked },
});
const names = ['Emma', 'Sam Pineda', 'Yoo', 'Kai', 'Mia', 'Fiona', 'Bob', 'Luz', 'Rachel Shaw', 'Theo'];
const scores = [4980, 4260, 3920, 3100, 2900, 2640, 2480, 2480, 2360, 1200];
const ranked: LeaderboardView = {
  mode: 'normal',
  entries: names.map((n, i) => ({ rank: i === 7 ? 7 : i + 1, userId: n.toLowerCase(), name: n, score: scores[i] })),
  me: { rank: 7, userId: 'bob', name: 'Bob', score: 2480 },
};

const entry: GalleryEntry = {
  name: 'LeaderboardScreen',
  group: 'screens',
  states: {
    'near me (fish unlocked)': () => <LeaderboardScreen player={player(true)} onBack={noop} onChallenge={noop} load={async () => ranked} />,
    'opened on fish tab (from Fish Report)': () => (
      <LeaderboardScreen player={player(true)} initialMode="fish" onBack={noop} onChallenge={noop} load={async (mode) => ({ ...ranked, mode })} />
    ),
    'fish requested but locked → pet shop tab': () => (
      <LeaderboardScreen player={player(false)} initialMode="fish" onBack={noop} onChallenge={noop} load={async (mode) => ({ ...ranked, mode })} />
    ),
    'no score yet': () => (
      <LeaderboardScreen player={player(false)} onBack={noop} onChallenge={noop} load={async () => ({ ...ranked, me: null, entries: ranked.entries.filter((e) => e.userId !== 'bob') })} />
    ),
    'load failed': () => <LeaderboardScreen player={player(false)} onBack={noop} onChallenge={noop} load={() => Promise.reject(new Error('down'))} />,
  },
};
export default entry;
