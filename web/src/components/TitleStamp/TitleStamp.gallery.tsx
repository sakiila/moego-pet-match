import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import type { TitleKey } from '../../game/report';
import { TITLE_STAMP } from '../../game/titleStamps';
import { TitleStamp } from './TitleStamp';

const TITLES = Object.keys(TITLE_STAMP) as TitleKey[];
const wrap = { display: 'flex', flexWrap: 'wrap', gap: 12 } as const;

const entry: GalleryEntry = {
  name: 'TitleStamp',
  group: 'components',
  states: {
    'all six (follows locale)': () => <div style={wrap}>{TITLES.map((k) => <TitleStamp key={k} title={k} />)}</div>,
    'report size (120) / small (80)': () => (
      <div style={{ ...wrap, alignItems: 'end' }}>
        <TitleStamp title="title.chain_lead" />
        <TitleStamp title="title.chain_lead" width={80} />
      </div>
    ),
    'on receipt paper': () => (
      <div style={{ background: 'var(--receipt-paper)', padding: 12, borderRadius: 12 }}>
        <TitleStamp title="title.scheduling_pro" />
      </div>
    ),
    'fish theme (paper card)': () => (
      <FishFrame>
        <div style={{ background: 'var(--receipt-paper)', padding: 12, borderRadius: 12 }}>
          <TitleStamp title="title.cleanup_chief" />
        </div>
      </FishFrame>
    ),
  },
};

export default entry;
