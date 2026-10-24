import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { Icon } from './Icon';
import { Tabs } from './Tabs';

function Demo({ variant, count, icons }: { variant: 'pill' | 'underline'; count: number; icons?: boolean }) {
  const [v, setV] = useState('a');
  const opts = [
    { value: 'a', label: '宠物店', icon: icons ? <Icon name={v === 'a' ? 'open-shop-white' : 'open-shop'} size={26} /> : undefined },
    { value: 'b', label: '鱼关卡', icon: icons ? <Icon name="leaderboard" size={26} /> : undefined },
  ].slice(0, count);
  return <Tabs value={v} options={opts} onChange={setV} variant={variant} label="demo" />;
}

const entry: GalleryEntry = {
  name: 'Tabs',
  group: 'primitives',
  states: {
    'pill · two': () => <Demo variant="pill" count={2} />,
    'pill · with icons': () => <Demo variant="pill" count={2} icons />,
    'pill · single (fish locked)': () => <Demo variant="pill" count={1} icons />,
    underline: () => <Demo variant="underline" count={2} />,
  },
};
export default entry;
