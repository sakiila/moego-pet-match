import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { TextArea } from './TextArea';

function Live({ initial = '' }: { initial?: string }) {
  const [v, setV] = useState(initial);
  return <TextArea label="补充说明（选填）" placeholder="可以说明希望移除哪些资料，方便核实。" value={v} onChange={setV} maxLength={1000} />;
}

const entry: GalleryEntry = {
  name: 'TextArea',
  group: 'primitives',
  states: { empty: () => <Live />, filled: () => <Live initial={'请移除图鉴背面的照片。\n名字可以保留。'} />, disabled: () => <TextArea label="Details" value="…" onChange={() => {}} disabled /> },
};
export default entry;
