import type { GalleryEntry } from '../../dev/gallery/types';
import { TodayStanding } from './TodayStanding';

const entry: GalleryEntry = {
  name: 'TodayStanding',
  group: 'components',
  states: {
    'rank 3, 1,240 behind': () => <TodayStanding standing={{ rank: 3, score: 13420, leaderScore: 14660, participants: 12 }} />,
    'rank 1 (first today)': () => <TodayStanding standing={{ rank: 1, score: 18410, leaderScore: 18410, participants: 12 }} />,
    'tied for first (gap 0 → first copy)': () => <TodayStanding standing={{ rank: 1, score: 18410, leaderScore: 18410, participants: 3 }} />,
    'alone today': () => <TodayStanding standing={{ rank: 1, score: 2480, leaderScore: 2480, participants: 1 }} />,
    'big gap, 6-digit numbers': () => <TodayStanding standing={{ rank: 48, score: 1200, leaderScore: 123456, participants: 60 }} />,
  },
};
export default entry;
