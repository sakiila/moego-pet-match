import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { TextField } from './TextField';

function Live({ initial = '', error }: { initial?: string; error?: string }) {
  const [v, setV] = useState(initial);
  return <TextField label="宠物名字" placeholder="填写宠物名字" value={v} onChange={setV} error={error} maxLength={40} />;
}

const entry: GalleryEntry = {
  name: 'TextField',
  group: 'primitives',
  states: {
    empty: () => <Live />,
    filled: () => <Live initial="Oreo" />,
    error: () => <Live error="请填写宠物名字。" />,
    'long English': () => <Live initial="Sir Fluffington the Third of Shanghai" />,
    disabled: () => <TextField label="Pet Name" value="Oreo" onChange={() => {}} disabled />,
  },
};
export default entry;
