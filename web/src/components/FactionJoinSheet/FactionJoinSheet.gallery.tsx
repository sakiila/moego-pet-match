import type { GalleryEntry } from '../../dev/gallery/types';
import { FactionJoinSheet } from './FactionJoinSheet';

const noop = () => {};
const ok = async () => {};
const props = { endsOn: '2026-11-02', onJoin: ok, onClose: noop, inline: true };

const entry: GalleryEntry = {
  name: 'FactionJoinSheet',
  group: 'components',
  states: {
    'nothing selected': () => <FactionJoinSheet {...props} />,
    'suggested cat (own pets)': () => <FactionJoinSheet {...props} suggested="cat" />,
    'dog selected': () => <FactionJoinSheet {...props} initial={{ selected: 'dog' }} />,
    'joining (busy)': () => <FactionJoinSheet {...props} initial={{ selected: 'cat', busy: true }} />,
    'error · retry': () => <FactionJoinSheet {...props} initial={{ selected: 'cat', error: 'failed' }} />,
    'error · closed': () => <FactionJoinSheet {...props} initial={{ selected: 'dog', error: 'closed' }} />,
  },
};
export default entry;
