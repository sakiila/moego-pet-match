import { UploadError } from '../api/client';
import type { GalleryEntry } from '../dev/gallery/types';
import { UploadScreen } from './UploadScreen';

const noop = () => {};
const player = { userId: 'U03FPQWGTN2', name: 'Bob 包博', best: { normal: 24800, fish: null }, progress: { completedNormalGames: 3, fishUnlocked: true }, streak: { days: 0, today: false } };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** 模拟缩图与分段上传，展示处理中 → 进度 → 等待保存三个阶段。 */
const slowPrepare = async (f: File) => (await wait(700), f);
const slowUpload = async (_p: string, _n: string, _q: string, _f: File, onProgress?: (fraction: number) => void) => {
  for (let i = 1; i <= 10; i++) {
    await wait(250);
    onProgress?.(i / 10);
  }
  await wait(800);
};

const entry: GalleryEntry = {
  name: 'UploadScreen',
  group: 'screens',
  states: {
    'empty (choose → submit succeeds)': () => <UploadScreen player={player} onHome={noop} onPlay={noop} submit={() => wait(600)} />,
    'preparing → uploading progress → saving': () => <UploadScreen player={player} onHome={noop} onPlay={noop} prepare={slowPrepare} submit={slowUpload} />,
    'submit fails → retry keeps form': () => <UploadScreen player={player} onHome={noop} onPlay={noop} submit={async () => { await wait(400); throw new UploadError('failed'); }} />,
    'daily limit': () => <UploadScreen player={player} onHome={noop} onPlay={noop} submit={async () => { throw new UploadError('daily_limit'); }} />,
    'server rejects photo': () => <UploadScreen player={player} onHome={noop} onPlay={noop} submit={async () => { throw new UploadError('invalid_photo'); }} />,
  },
};
export default entry;
