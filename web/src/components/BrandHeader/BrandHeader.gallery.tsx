import type { GalleryEntry } from '../../dev/gallery/types';
import { Avatar } from '../../ui/primitives/Avatar';
import { BrandHeader } from './BrandHeader';

const entry: GalleryEntry = {
  name: 'BrandHeader',
  group: 'components',
  states: {
    'scheduling + tagline (board)': () => <BrandHeader tagline="board.tagline" />,
    'scheduling (prep)': () => <BrandHeader />,
    'game + subtitle (identity)': () => <BrandHeader title="game" tagline="access.subtitle" />,
    'page heading + back (leaderboard)': () => <BrandHeader heading="排行榜" onBack={() => {}} />,
    'accent heading + back (report)': () => <BrandHeader heading="Grooming Report Card" headingAccent tagline="report.subtitle" onBack={() => {}} />,
    'game + avatar (home)': () => <BrandHeader title="game" trailing={<Avatar name="Bob" size={36} />} />,
  },
};

export default entry;
