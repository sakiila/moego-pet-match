import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { PLACEHOLDER_PETS } from '../../game/pets';
import { TipBar } from './TipBar';

const entry: GalleryEntry = {
  name: 'TipBar',
  group: 'components',
  states: {
    'empty (reserves space)': () => <TipBar tip={null} />,
    'tutorial · comb': () => <TipBar tip={{ key: 'tutorial.comb' }} />,
    'tutorial · scissors': () => <TipBar tip={{ key: 'tutorial.scissors' }} />,
    'tutorial · combo': () => <TipBar tip={{ key: 'tutorial.tool_combo' }} />,
    'move hint': () => <TipBar tip={{ key: 'board.move_hint' }} />,
    'fish · conch · pearl shell · hint': () => (
      <FishFrame>
        <TipBar tip={{ key: 'tutorial.conch' }} />
        <TipBar tip={{ key: 'tutorial.pearl_shell' }} />
        <TipBar tip={{ key: 'board.move_hint' }} />
      </FishFrame>
    ),
    'new pets · 3 merged': () => (
      <TipBar tip={{ key: 'board.new_pets', vars: { count: 3 }, petIds: ['mochi', 'tofu', 'kiwi'] }} pets={PLACEHOLDER_PETS} />
    ),
    'new pets · single': () => <TipBar tip={{ key: 'board.new_pets', vars: { count: 1 }, petIds: ['luna'] }} pets={PLACEHOLDER_PETS} />,
    reunion: () => <TipBar tip={{ key: 'board.reunion', petIds: ['peanut', 'pepper'] }} pets={PLACEHOLDER_PETS} />,
    'reunion · developer egg (Maodu + Boluo)': () => <TipBar tip={{ key: 'board.reunion_hotpot', petIds: ['tofu', 'kiwi'] }} pets={PLACEHOLDER_PETS} />,
    shuffle: () => <TipBar tip={{ key: 'board.shuffle' }} />,
    'last 10 s': () => <TipBar tip={{ key: 'round.last_seconds' }} />,
    finishing: () => <TipBar tip={{ key: 'round.finishing' }} />,
  },
};

export default entry;
