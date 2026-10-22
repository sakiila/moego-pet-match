import type { GalleryEntry } from '../../dev/gallery/types';
import { ColleagueCard } from './ColleagueCard';

const noop = () => {};

const entry: GalleryEntry = {
  name: 'ColleagueCard',
  group: 'components',
  states: {
    default: () => <ColleagueCard userId="U1" name="Alice Chen" selected={false} onSelect={noop} />,
    selected: () => <ColleagueCard userId="U2" name="Bob" selected onSelect={noop} />,
    'mixed name': () => <ColleagueCard userId="U3" name="Zhang Wei(张伟)" selected={false} onSelect={noop} />,
    'long name': () => <ColleagueCard userId="U4" name="Maximilian Alexander Featherstonehaugh" selected onSelect={noop} />,
  },
};

export default entry;
