import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { Button } from '../../ui/primitives/Button';
import { ScreenTransition } from './ScreenTransition';

const order = ['home', 'petdex', 'upload'] as const;

function Demo() {
  const [i, setI] = useState(0);
  const go = (n: number) => setI(Math.min(order.length - 1, Math.max(0, n)));
  return (
    <div style={{ width: '100%' }}>
      <ScreenTransition routeName={order[i]}>
        <div style={{ padding: 16, minHeight: 120, background: 'var(--card)', borderRadius: 12 }}>
          <strong>{order[i]}</strong>
          <p style={{ margin: '8px 0 0' }}>{i === 0 ? '前进：新页从右侧滑入' : '返回：新页从左侧滑入'}</p>
        </div>
      </ScreenTransition>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button variant="secondary" onClick={() => go(i - 1)} disabled={i === 0}>
          返回
        </Button>
        <Button variant="secondary" onClick={() => go(i + 1)} disabled={i === order.length - 1}>
          前进
        </Button>
      </div>
    </div>
  );
}

const entry: GalleryEntry = {
  name: 'ScreenTransition',
  group: 'components',
  states: {
    '前进 / 返回方向': () => <Demo />,
  },
};

export default entry;
