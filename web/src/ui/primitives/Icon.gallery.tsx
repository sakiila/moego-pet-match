import type { ReactNode } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { ICON_CATALOG } from '../icons/catalog';
import { Icon, type IconName } from './Icon';

const NAMES = [...Object.keys(ICON_CATALOG), 'my-titles', 'clock-out', 'paw-print', 'paw-cute', 'paw-pets', 'paw-play', 'paw-love'] as IconName[];
const SIZES = [24, 32, 48];

function Grid({ names = NAMES }: { names?: IconName[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
      {names.map((name) => (
        <div key={name} style={{ display: 'grid', gap: 4, justifyItems: 'center', fontSize: 11 }}>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {SIZES.map((s) => (
              <Icon key={s} name={name} size={s} />
            ))}
          </span>
          {name}
        </div>
      ))}
    </div>
  );
}

function Surface({ bg, color, children }: { bg: string; color?: string; children: ReactNode }) {
  return <div style={{ background: bg, color, padding: 12, borderRadius: 16 }}>{children}</div>;
}

const entry: GalleryEntry = {
  name: 'Icon',
  group: 'primitives',
  states: {
    'player menu (20 / 24 / 32)': () => <div style={{ display: 'flex', gap: 16 }}>{(['my-titles', 'clock-out'] as const).map(name => <span key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{[20, 24, 32].map(size => <Icon key={size} name={name} size={size} label={name} />)}</span>)}</div>,
    'light (24 / 32 / 48)': () => (
      <Surface bg="var(--color-paper)">
        <Grid />
      </Surface>
    ),
    'brand orange': () => (
      <Surface bg="var(--color-brand)" color="var(--color-paper)">
        <Grid />
      </Surface>
    ),
    'fish theme': () => (
      <FishFrame>
        <Grid />
      </FishFrame>
    ),
    'title stamp (wide)': () => (
      <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
        <Icon name="title-stamp" size={48} />
        <Icon name="title-stamp" size={72} />
        <Icon name="title-stamp" size={110} />
      </div>
    ),
    'icon-only with label': () => <Icon name="settings" size={32} label="设置" />,
  },
};

export default entry;
