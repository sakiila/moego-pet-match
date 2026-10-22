import type { GalleryEntry } from '../../dev/gallery/types';
import { TipBar } from './TipBar';

const entry: GalleryEntry = {
  name: 'TipBar',
  group: 'components',
  states: {
    'empty (reserves space)': () => <TipBar tip={null} />,
    'tutorial · comb': () => <TipBar tip="tutorial.comb" />,
    'tutorial · scissors': () => <TipBar tip="tutorial.scissors" />,
    'tutorial · combo': () => <TipBar tip="tutorial.tool_combo" />,
    'move hint': () => <TipBar tip="board.move_hint" />,
    shuffle: () => <TipBar tip="board.shuffle" />,
    'last 10 s': () => <TipBar tip="round.last_seconds" />,
    finishing: () => <TipBar tip="round.finishing" />,
  },
};

export default entry;
