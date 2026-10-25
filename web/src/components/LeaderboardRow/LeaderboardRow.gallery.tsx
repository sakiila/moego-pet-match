import type { GalleryEntry } from '../../dev/gallery/types';
import { LeaderboardHeader, LeaderboardRow } from './LeaderboardRow';

const e = (rank: number, name: string, score: number) => ({ rank, userId: name, name, score });

const entry: GalleryEntry = {
  name: 'LeaderboardRow',
  group: 'components',
  states: {
    'clickable player': () => <LeaderboardRow entry={{ ...e(3, 'Alice Chen', 13770), equippedTitle: 'friends' }} isMe={false} tied={false} onSelect={() => {}} />,
    'legendary · C size': () => <LeaderboardRow entry={{ ...e(4, 'Bob', 31000), equippedTitle: 'album' }} isMe={false} tied={false} />,
    'hotpot · unified showcase': () => <LeaderboardRow entry={{ ...e(4, 'Bob', 31000), equippedTitle: 'hotpot' }} isMe={false} tied={false} />,
    header: () => <LeaderboardHeader />,
    'top three': () => (
      <div style={{ display: 'grid', gap: 8 }}>
        <LeaderboardRow entry={e(1, 'Emma', 49800)} isMe={false} tied={false} />
        <LeaderboardRow entry={e(2, 'Sam', 42600)} isMe={false} tied={false} />
        <LeaderboardRow entry={e(3, 'Yoo', 39200)} isMe={false} tied={false} />
      </div>
    ),
    'equipped title': () => <LeaderboardRow entry={{ ...e(7, 'Alexandria Montgomery-Wellington', 24800), equippedTitle: 'species' }} isMe tied />,
    'title · long name + six digits': () => <LeaderboardRow entry={{ ...e(123, 'Alexandria Catherine Montgomery-Wellington', 1234567), equippedTitle: 'neighbors' }} isMe tied />,
    default: () => <LeaderboardRow entry={e(6, 'Fiona', 26400)} isMe={false} tied={false} />,
    me: () => <LeaderboardRow entry={e(1, 'Bob 包博', 30)} isMe tied={false} />,
    'me + tied': () => <LeaderboardRow entry={e(7, 'Bob', 24800)} isMe tied />,
    'long name': () => <LeaderboardRow entry={e(9, 'Maximilian Alexander Featherstonehaugh', 23600)} isMe={false} tied={false} />,
    'saved zero': () => <LeaderboardRow entry={e(42, 'Rachel Shaw', 0)} isMe={false} tied />,
  },
};
export default entry;
