import type { ReactNode } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { ColleagueCard } from './ColleagueCard';

const noop = () => {};
// 选中时蓝猫探出卡片上沿，留出上方空间
const room = (children: ReactNode) => <div style={{ paddingTop: 60 }}>{children}</div>;

const entry: GalleryEntry = {
  name: 'ColleagueCard',
  group: 'components',
  states: {
    default: () => <ColleagueCard userId="U1" name="Alice Chen" selected={false} onSelect={noop} />,
    selected: () => room(<ColleagueCard userId="U2" name="Bob" selected onSelect={noop} />),
    'mixed name': () => <ColleagueCard userId="U3" name="Zhang Wei(张伟)" selected={false} onSelect={noop} />,
    'long name · selected': () => room(<ColleagueCard userId="U4" name="Maximilian Alexander Featherstonehaugh" selected onSelect={noop} />),
    'in list (second selected)': () => (
      <div style={{ display: 'grid', gap: 8 }}>
        <ColleagueCard userId="U1" name="Bob" selected={false} onSelect={noop} />
        <ColleagueCard userId="U5" name="Bob 包博" selected onSelect={noop} />
      </div>
    ),
  },
};

export default entry;
