import type { GalleryEntry } from '../../dev/gallery/types';
import { FactionCard } from './FactionCard';
import { FACTION_SAMPLES as S } from './factionFixtures';

const noop = () => {};

const entry: GalleryEntry = {
  name: 'FactionCard',
  group: 'components',
  states: {
    'not joined': () => <FactionCard state={S.notJoined} onJoin={noop} onOpen={noop} />,
    'first day, no scores': () => <FactionCard state={S.firstDay} onJoin={noop} onOpen={noop} />,
    'joined cat · 3 rounds left': () => <FactionCard state={S.cat} onJoin={noop} onOpen={noop} />,
    'joined dog · today full': () => <FactionCard state={S.dogFull} onJoin={noop} onOpen={noop} />,
    'overtake notice': () => <FactionCard state={S.cat} overtake="cat" onJoin={noop} onOpen={noop} />,
    'fog (final day)': () => <FactionCard state={S.fog} onJoin={noop} onOpen={noop} />,
    'ended · won badge': () => <FactionCard state={S.endedWin} onJoin={noop} onOpen={noop} />,
    'ended · lost': () => <FactionCard state={S.endedLose} onJoin={noop} onOpen={noop} />,
    'ended · tie': () => <FactionCard state={S.endedTie} onJoin={noop} onOpen={noop} />,
    'loading / hidden (renders nothing)': () => <FactionCard state={null} onJoin={noop} onOpen={noop} />,
  },
};
export default entry;
