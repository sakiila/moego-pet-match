import { useState } from 'react';
import type { GameMode } from '../api/types';
import type { GalleryEntry } from '../dev/gallery/types';
import { PRESETS } from '../dev/presets';
import { createGame } from '../engine';
import { PLACEHOLDER_PETS, SAMPLE_FISH } from '../game/pets';
import { BoardScreen } from './BoardScreen';

const AUTO_FIVE = {
  board: ['BAACAAD', 'CDECABC', 'EFCBCDE', 'ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA'],
  refill: [0, 3, 5, 1, 2, 3, 4],
};
const noop = () => {};

/** 手动：(5,3)→(6,3)；补落：(2,2)→(2,3)，生成后 (0,3)→(0,4) 发动。 */
function Preview({ mode = 'normal', automatic = false }: { mode?: GameMode; automatic?: boolean }) {
  const pets = mode === 'fish' ? SAMPLE_FISH : PLACEHOLDER_PETS;
  const [initial] = useState(() => createGame({
    seed: 1,
    lineup: pets.map((p) => p.id),
    ...(automatic ? AUTO_FIVE : PRESETS.five),
  }));
  return <BoardScreen game={initial} pets={pets} mode={mode} onFinished={noop} onExit={noop} />;
}

const entry: GalleryEntry = {
  name: 'DryerGeneration',
  group: 'screens',
  states: {
    'manual five': () => <Preview />,
    'refill five': () => <Preview automatic />,
    'fish five': () => <Preview mode="fish" />,
  },
};

export default entry;
