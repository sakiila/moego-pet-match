import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { Button } from '../../ui/primitives/Button';
import { ModeMark } from './ModeMark';

const row = { display: 'flex', gap: 12, alignItems: 'center' } as const;

const entry: GalleryEntry = {
  name: 'ModeMark',
  group: 'components',
  states: {
    'normal / fish': () => (
      <div style={row}>
        <ModeMark mode="normal" size={24} />
        <ModeMark mode="normal" size={32} />
        <ModeMark mode="fish" size={24} />
        <ModeMark mode="fish" size={32} />
      </div>
    ),
    'on primary button': () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <Button size="lg" block icon={<ModeMark mode="normal" tone="onAccent" size={32} />}>开始这班</Button>
        <Button size="lg" block icon={<ModeMark mode="fish" tone="onAccent" size={32} />}>开始这班</Button>
      </div>
    ),
    'fish theme': () => (
      <FishFrame>
        <Button size="lg" block icon={<ModeMark mode="fish" tone="onAccent" size={32} />}>Start This Shift</Button>
      </FishFrame>
    ),
  },
};

export default entry;
