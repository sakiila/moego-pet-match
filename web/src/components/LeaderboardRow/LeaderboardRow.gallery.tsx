import type { GalleryEntry } from '../../dev/gallery/types';
import { LeaderboardRow } from './LeaderboardRow';

const e = (rank: number, name: string, score: number) => ({ rank, userId: name, name, score });

const entry: GalleryEntry = {
  name: 'LeaderboardRow',
  group: 'components',
  states: {
    default: () => <LeaderboardRow entry={e(6, 'Fiona', 2640)} isMe={false} tied={false} />,
    'me + tied': () => <LeaderboardRow entry={e(7, 'Bob', 2480)} isMe tied />,
    'long name': () => <LeaderboardRow entry={e(9, 'Maximilian Alexander Featherstonehaugh', 2360)} isMe={false} tied={false} />,
    'saved zero': () => <LeaderboardRow entry={e(42, 'Rachel Shaw', 0)} isMe={false} tied />,
  },
};
export default entry;
