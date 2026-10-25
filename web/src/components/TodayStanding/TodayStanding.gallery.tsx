import type { GalleryEntry } from '../../dev/gallery/types';
import { TodayStanding } from './TodayStanding';

const entry: GalleryEntry = {
  name: 'TodayStanding',
  group: 'components',
  states: {
    'rank 3': () => <TodayStanding standing={{ rank: 3, score: 134200, leaderScore: 146600, participants: 12 }} />,
    'rank 1 (first today)': () => <TodayStanding standing={{ rank: 1, score: 184100, leaderScore: 184100, participants: 12 }} />,
    'tied for first (gap 0 → first copy)': () => <TodayStanding standing={{ rank: 1, score: 184100, leaderScore: 184100, participants: 3 }} />,
    'alone today': () => <TodayStanding standing={{ rank: 1, score: 24800, leaderScore: 24800, participants: 1 }} />,
    'rank 48 (two digits)': () => <TodayStanding standing={{ rank: 48, score: 1200, leaderScore: 123456, participants: 60 }} />,
  },
};
export default entry;
