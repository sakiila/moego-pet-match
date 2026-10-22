import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { Button } from '../../ui/primitives/Button';
import { ParticleLayer, type Burst } from './ParticleLayer';

function Demo() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const fire = () => setBursts((b) => [...b, { key: b.length + 1, cells: [{ r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 }] }]);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ position: 'relative', width: 280, height: 280, background: 'var(--panel)', borderRadius: 12 }}>
        <ParticleLayer bursts={bursts} cellPx={40} size={7} />
      </div>
      <Button variant="secondary" onClick={fire}>
        Burst row 3
      </Button>
    </div>
  );
}

const entry: GalleryEntry = {
  name: 'ParticleLayer',
  group: 'components',
  states: { 'click to burst': () => <Demo /> },
};

export default entry;
