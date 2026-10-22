import type { GalleryEntry } from '../dev/gallery/types';
import { createGame } from '../engine';
import { PLACEHOLDER_PETS } from '../game/pets';
import { BoardScreen } from './BoardScreen';
import { PrepScreen } from './PrepScreen';
import { ReportScreen } from './ReportScreen';

const noop = () => {};
const lineup = PLACEHOLDER_PETS.map((p) => p.id);

const entry: GalleryEntry = {
  name: 'Screens',
  group: 'screens',
  states: {
    prep: () => <PrepScreen pets={PLACEHOLDER_PETS} onStart={noop} />,
    'board (live)': () => <BoardScreen game={createGame({ seed: 11, lineup })} pets={PLACEHOLDER_PETS} onFinished={noop} onExit={noop} />,
    report: () => (
      <ReportScreen
        summary={{ score: 2480, clearedCells: 186, maxChain: 4, toolsFired: 6, validMoves: 40, actedInLastSeconds: true, rushSucceeded: true, pets: [] }}
        onPlayAgain={noop}
      />
    ),
  },
};

export default entry;
