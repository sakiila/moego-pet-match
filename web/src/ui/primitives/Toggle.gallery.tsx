import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { Toggle } from './Toggle';

function Live({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  return <Toggle checked={on} onChange={setOn} label="轻震" onText="开" offText="关" />;
}

const entry: GalleryEntry = {
  name: 'Toggle',
  group: 'primitives',
  states: {
    off: () => <Live initial={false} />,
    on: () => <Live initial />,
    disabled: () => <Toggle checked={false} onChange={() => {}} label="Haptics" onText="On" offText="Off" disabled />,
    English: () => <Toggle checked onChange={() => {}} label="Haptics" onText="On" offText="Off" />,
  },
};
export default entry;
