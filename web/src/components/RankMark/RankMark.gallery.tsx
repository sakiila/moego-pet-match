import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { RankMark } from './RankMark';

const row = { display: 'flex', gap: 16, alignItems: 'center' } as const;

const entry: GalleryEntry = {
  name: 'RankMark',
  group: 'components',
  states: {
    '1 · 2 · 3 · 4 · 12': () => (
      <div style={row}>
        {[1, 2, 3, 4, 12].map((r) => <RankMark key={r} rank={r} />)}
      </div>
    ),
    'tied 1 · 2 · 2 · 4': () => (
      <div style={row}>
        {[1, 2, 2, 4].map((r, i) => <RankMark key={i} rank={r} />)}
      </div>
    ),
    'podium size (64)': () => (
      <div style={{ ...row, alignItems: 'end' }}>
        {[2, 1, 3].map((r) => <RankMark key={r} rank={r} size={64} />)}
      </div>
    ),
    'fish theme': () => (
      <FishFrame>
        <div style={row}>
          {[1, 2, 3, 4].map((r) => <RankMark key={r} rank={r} />)}
        </div>
      </FishFrame>
    ),
  },
};

export default entry;
