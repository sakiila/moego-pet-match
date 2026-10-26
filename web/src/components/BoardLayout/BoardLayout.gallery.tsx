import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { PREVIEW_PREP_PETS } from '../../dev/prepPets';
import { createGame } from '../../engine';
import type { GameMode } from '../../api/types';
import { parseBoard } from '../../engine/board';
import { frameAt } from '../../game/playback';
import { SAMPLE_FISH } from '../../game/pets';
import { BoardScreen } from '../../screens/BoardScreen';
import { Board } from '../Board/Board';
import { BoardControls } from '../BoardControls/BoardControls';
import { BrandHeader } from '../BrandHeader/BrandHeader';
import { RushBar, type RushView } from '../RushBar/RushBar';
import { SettingsDialog } from '../SettingsDialog/SettingsDialog';
import { QuitDialog } from '../QuitDialog/QuitDialog';
import { StatusPanel } from '../StatusPanel/StatusPanel';
import { TimeUpBanner } from '../TimeUpBanner/TimeUpBanner';
import { TipBar } from '../TipBar/TipBar';
import { BoardLayout } from './BoardLayout';

const rows = ['ABCDEFA', 'CDEFABC', 'EFABCDE', 'BChADEF', 'DEFABxC', 'FABCDEF', 'ABCDEFA'];
const frame = frameAt({ board: parseBoard(rows).board, score: 2480, rushProgress: 7 }, null, 0);

function Review({ rush = { state: 'active', served: 7, secondsLeft: 8 }, mode = 'normal', ending = false, zero = false, score = 2480 }: { rush?: RushView; mode?: GameMode; ending?: boolean; zero?: boolean; score?: number }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const pets = mode === 'fish' ? SAMPLE_FISH : PREVIEW_PREP_PETS;
  return <BoardLayout
    mode={mode}
    header={<BrandHeader title="scheduling" boardArt tagline="board.tagline" />}
    status={<StatusPanel timeLeftMs={ending ? 0 : 48_000} score={zero ? 0 : score} />}
    rush={<RushBar view={ending ? { state: 'hidden' } : rush} mode={mode} />}
    board={<Board frame={frame} pets={pets} mode={mode} interactive={false} staticSelected={{ r: 3, c: 2 }} staticPreview={Array.from({ length: 7 }, (_, c) => ({ r: 3, c }))} />}
    tip={<TipBar tip={{ key: ending ? 'round.finishing' : 'tutorial.comb' }} pets={pets} />}
    controls={<BoardControls timeUp={ending} onSettings={() => setSettingsOpen(true)} onExit={() => setQuitOpen(true)} />}
  >
    <SettingsDialog variant="board" open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    <QuitDialog open={quitOpen} onCancel={() => setQuitOpen(false)} onConfirm={() => setQuitOpen(false)} />
    {ending && <TimeUpBanner pets={zero ? [] : pets.slice(0, 3)} mode={mode} />}
  </BoardLayout>;
}

function LocalRound({ mode = 'normal' }: { mode?: GameMode }) {
  const pets = mode === 'fish' ? SAMPLE_FISH : PREVIEW_PREP_PETS;
  const [game] = useState(() => createGame({ seed: 11, lineup: pets.map((pet) => pet.id), board: mode === 'fish' ? rows : undefined }));
  const [done, setDone] = useState(false);
  return done
    ? <Review mode={mode} ending />
    : <BoardScreen mode={mode} game={game} pets={pets} startAt={29_000} speed={3} onFinished={() => setDone(true)} onExit={() => setDone(true)} />;
}

export default {
  name: 'BoardLayout',
  group: 'screens',
  states: {
    'active · approved 48s / 7 of 12': () => <Review />,
    'no rush · fixed board': () => <Review rush={{ state: 'hidden' }} />,
    'large score · narrow panels': () => <Review score={128_460} />,
    success: () => <Review rush={{ state: 'success' }} />,
    expired: () => <Review rush={{ state: 'expired' }} />,
    'finished · three served pets': () => <Review ending />,
    'finished · zero service': () => <Review ending zero />,
    'fish · active': () => <Review mode="fish" />,
    'fish · finished': () => <Review mode="fish" ending />,
    'local interactive round · no save': () => <LocalRound />,
    'fish · local interactive round · no save': () => <LocalRound mode="fish" />,
  },
} satisfies GalleryEntry;

