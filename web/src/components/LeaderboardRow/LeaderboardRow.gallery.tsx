import type { GalleryEntry } from '../../dev/gallery/types';
import { LeaderboardHeader, LeaderboardRow } from './LeaderboardRow';

const e = (rank: number, name: string, score: number) => ({ rank, userId: name, name, score });

const entry: GalleryEntry = {
  name: 'LeaderboardRow',
  group: 'components',
  states: {
    'legendary · C size': () => <LeaderboardRow entry={{ ...e(4, 'Bob', 3100), equippedTitle: 'album' }} isMe={false} tied={false} />,
    header: () => <LeaderboardHeader />,
    'top three': () => (
      <div style={{ display: 'grid', gap: 8 }}>
        <LeaderboardRow entry={e(1, 'Emma', 4980)} isMe={false} tied={false} />
        <LeaderboardRow entry={e(2, 'Sam', 4260)} isMe={false} tied={false} />
        <LeaderboardRow entry={e(3, 'Yoo', 3920)} isMe={false} tied={false} />
      </div>
    ),
    'equipped title': () => <LeaderboardRow entry={{ ...e(7, 'Alexandria Montgomery-Wellington', 2480), equippedTitle: 'species' }} isMe tied />,
    'title · long name + six digits': () => <LeaderboardRow entry={{ ...e(123, 'Alexandria Catherine Montgomery-Wellington', 1234567), equippedTitle: 'neighbors' }} isMe tied />,
    default: () => <LeaderboardRow entry={e(6, 'Fiona', 2640)} isMe={false} tied={false} />,
    'me + tied': () => <LeaderboardRow entry={e(7, 'Bob', 2480)} isMe tied />,
    'long name': () => <LeaderboardRow entry={e(9, 'Maximilian Alexander Featherstonehaugh', 2360)} isMe={false} tied={false} />,
    'saved zero': () => <LeaderboardRow entry={e(42, 'Rachel Shaw', 0)} isMe={false} tied />,
  },
};
export default entry;
