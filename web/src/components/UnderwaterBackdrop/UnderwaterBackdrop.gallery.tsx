import type { GalleryEntry } from '../../dev/gallery/types';
import { UnderwaterBackdrop } from './UnderwaterBackdrop';

const frame = (label: string) => (
  <div data-theme="fish" style={{ position: 'relative', height: 420, maxWidth: 390, borderRadius: 16, overflow: 'hidden', color: 'var(--fg)' }}>
    <UnderwaterBackdrop inline />
    <p style={{ position: 'relative', padding: 16, margin: 0 }}>{label}</p>
  </div>
);

const entry: GalleryEntry = {
  name: 'UnderwaterBackdrop',
  group: 'components',
  states: { default: () => frame('鱼关水下背景（只作装饰）') },
};
export default entry;
