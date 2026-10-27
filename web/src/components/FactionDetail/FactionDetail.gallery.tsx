import type { GalleryEntry } from '../../dev/gallery/types';
import { FactionDetail } from './FactionDetail';
import { FACTION_SAMPLES as S } from '../FactionCard/factionFixtures';

const noop = () => {};

const entry: GalleryEntry = {
  name: 'FactionDetail',
  group: 'components',
  states: {
    'not joined': () => <FactionDetail inline state={S.notJoined} onJoin={noop} onClose={noop} />,
    'first day (no highlights)': () => <FactionDetail inline state={S.firstDay} onJoin={noop} onClose={noop} />,
    'joined cat · long names': () => <FactionDetail inline state={S.cat} onClose={noop} />,
    'joined dog · today full': () => <FactionDetail inline state={S.dogFull} onClose={noop} />,
    'fog': () => <FactionDetail inline state={S.fog} onClose={noop} />,
    'ended · won badge': () => <FactionDetail inline state={S.endedWin} onClose={noop} />,
    'ended · lost (empty lists)': () => <FactionDetail inline state={S.endedLose} onClose={noop} />,
    'ended · tie': () => <FactionDetail inline state={S.endedTie} onClose={noop} />,
  },
};
export default entry;
