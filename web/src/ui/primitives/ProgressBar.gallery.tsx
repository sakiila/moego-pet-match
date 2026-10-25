import type { GalleryEntry } from '../../dev/gallery/types';
import { ProgressBar } from './ProgressBar';

const entry: GalleryEntry = {
  name: 'ProgressBar',
  group: 'primitives',
  states: {
    empty: () => <ProgressBar value={0} label="上传进度" />,
    half: () => <ProgressBar value={0.42} label="上传进度" />,
    full: () => <ProgressBar value={1} label="上传进度" />,
    indeterminate: () => <ProgressBar value={null} label="正在处理照片" />,
    English: () => <ProgressBar value={0.7} label="Upload progress" />,
  },
};
export default entry;
