import type { GalleryEntry } from '../dev/gallery/types';
import { createGame, type GameSummary } from '../engine';
import { PLACEHOLDER_PETS } from '../game/pets';
import { BoardScreen } from './BoardScreen';
import { PrepScreen } from './PrepScreen';
import { ReportScreen } from './ReportScreen';

const noop = () => {};
const lineup = PLACEHOLDER_PETS.map((p) => p.id);
const summary: GameSummary = {
  score: 2480,
  clearedCells: 186,
  clearedByMultiplier: [120, 40, 20, 6, 0],
  maxChain: 4,
  toolsFired: 6,
  validMoves: 40,
  actedInLastSeconds: true,
  rushSucceeded: true,
  pets: [],
};

const entry: GalleryEntry = {
  name: 'Screens',
  group: 'screens',
  states: {
    'prep · registering': () => <PrepScreen pets={null} onStart={noop} />,
    'prep · failed': () => <PrepScreen pets={null} failed onStart={noop} onRetry={noop} />,
    'prep · ready': () => <PrepScreen pets={PLACEHOLDER_PETS} onStart={noop} />,
    'board (live, local)': () => <BoardScreen game={createGame({ seed: 11, lineup })} pets={PLACEHOLDER_PETS} onFinished={noop} onExit={noop} />,
    'report · saving': () => <ReportScreen summary={summary} save={{ kind: 'saving' }} onRetry={noop} onPlayAgain={noop} onHome={noop} />,
    'report · retryable': () => <ReportScreen summary={summary} save={{ kind: 'retryable' }} onRetry={noop} onPlayAgain={noop} onHome={noop} />,
  },
};

export default entry;
