import { UploadError } from '../api/client';
import type { GalleryEntry } from '../dev/gallery/types';
import { UploadScreen } from './UploadScreen';

const noop = () => {};
const player = { userId: 'U03FPQWGTN2', name: 'Bob 包博', best: { normal: 2480, fish: null }, progress: { completedNormalGames: 3, fishUnlocked: true }, streak: { days: 0, today: false } };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const entry: GalleryEntry = {
  name: 'UploadScreen',
  group: 'screens',
  states: {
    'empty (choose → submit succeeds)': () => <UploadScreen player={player} onHome={noop} onPlay={noop} submit={() => wait(600)} />,
    'submit fails → retry keeps form': () => <UploadScreen player={player} onHome={noop} onPlay={noop} submit={async () => { await wait(400); throw new UploadError('failed'); }} />,
    'daily limit': () => <UploadScreen player={player} onHome={noop} onPlay={noop} submit={async () => { throw new UploadError('daily_limit'); }} />,
    'server rejects photo': () => <UploadScreen player={player} onHome={noop} onPlay={noop} submit={async () => { throw new UploadError('invalid_photo'); }} />,
  },
};
export default entry;
