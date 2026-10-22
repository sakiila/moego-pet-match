import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { Tabs } from './Tabs';

function Demo({ variant, count }: { variant: 'pill' | 'underline'; count: number }) {
  const opts = [
    { value: 'a', label: '🐾 宠物店' },
    { value: 'b', label: '🐟 鱼关卡' },
  ].slice(0, count);
  const [v, setV] = useState('a');
  return <Tabs value={v} options={opts} onChange={setV} variant={variant} label="demo" />;
}

const entry: GalleryEntry = {
  name: 'Tabs',
  group: 'primitives',
  states: {
    'pill · two': () => <Demo variant="pill" count={2} />,
    'pill · single (fish locked)': () => <Demo variant="pill" count={1} />,
    underline: () => <Demo variant="underline" count={2} />,
  },
};
export default entry;
