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
  combos: { cc: 0, cs: 1, ss: 0 },
  validMoves: 40,
  actedInLastSeconds: true,
  rushSucceeded: true,
  pets: PLACEHOLDER_PETS.map((p, order) => ({ id: p.id, order, served: [30, 12, 8, 5, 0, 0][order], firstServedSeq: [2, 1, 3, 4, null, null][order] })),
};
const reportProps = {
  mode: 'normal' as const,
  summary,
  pets: PLACEHOLDER_PETS,
  onRetry: noop,
  onPlayAgain: noop,
  onHome: noop,
  onLeaderboard: noop,
  onFishInvite: noop,
  onAnswerQuiz: async () => ({ correct: true, skipped: false, owner: { userId: 'U2', name: 'Zhang Wei' } }),
};

const entry: GalleryEntry = {
  name: 'Screens',
  group: 'screens',
  states: {
    'prep · registering': () => <PrepScreen pets={null} onStart={noop} />,
    'prep · failed': () => <PrepScreen pets={null} failed onStart={noop} onRetry={noop} />,
    'prep · ready': () => <PrepScreen pets={PLACEHOLDER_PETS} onStart={noop} />,
    'board (live, local)': () => <BoardScreen game={createGame({ seed: 11, lineup })} pets={PLACEHOLDER_PETS} onFinished={noop} onExit={noop} />,
    'report · saving': () => <ReportScreen {...reportProps} save={{ kind: 'saving' }} />,
    'report · retryable': () => <ReportScreen {...reportProps} save={{ kind: 'retryable' }} />,
    'report · saved (record, collection, quiz, fish invite)': () => (
      <ReportScreen
        {...reportProps}
        save={{
          kind: 'saved',
          newPets: PLACEHOLDER_PETS.slice(0, 2),
          response: {
            gameId: 'g',
            score: 2480,
            personalBest: { previous: 1200, current: 2480, isNew: true },
            newCollected: [],
            progress: { completedNormalGames: 3, fishUnlocked: true, unlockedNow: true, counted: true },
            quiz: { quizId: 'q', petId: 'kiwi', petName: 'Kiwi', options: [{ userId: 'U1', name: 'Alice' }, { userId: 'U2', name: 'Zhang Wei' }, { userId: 'U3', name: 'Sam' }] },
          },
        }}
      />
    ),
    'report · zero service': () => (
      <ReportScreen {...reportProps} summary={{ ...summary, score: 0, clearedCells: 0, clearedByMultiplier: [0, 0, 0, 0, 0], maxChain: 0, toolsFired: 0, rushSucceeded: false, pets: summary.pets.map((p) => ({ ...p, served: 0, firstServedSeq: null })) }} save={{ kind: 'saving' }} />
    ),
  },
};

export default entry;
