import type { GalleryEntry } from '../../dev/gallery/types';
import { NavTile } from './NavTile';

const entry: GalleryEntry = {
  name: 'NavTile',
  group: 'components',
  states: { leaderboard: () => <NavTile icon="🏆" label="排行榜" onClick={() => {}} />, 'long label': () => <NavTile icon="📖" label="Pet Collection" onClick={() => {}} /> },
};
export default entry;
