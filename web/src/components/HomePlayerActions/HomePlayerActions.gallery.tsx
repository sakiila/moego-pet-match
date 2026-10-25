import type { GalleryEntry } from '../../dev/gallery/types';
import type { PlayerLikesState } from '../../game/playerLikes';
import { HomePlayerActions } from './HomePlayerActions';

const noop = () => {};
const player = { userId: 'U_TEST_BOB', name: 'Bob', best: { normal: null, fish: null }, progress: { completedNormalGames: 0, fishUnlocked: false }, streak: { days: 0, today: false } };
const likes: PlayerLikesState = { view: { receivedLikes: 12, likedByViewer: false, canLike: false }, loading: false, sending: false, error: null, celebration: 0 };
const entry: GalleryEntry = { name: 'HomePlayerActions', group: 'components', states: {
  default: () => <HomePlayerActions player={player} likes={likes} onProfile={noop} onClockOut={noop} onTitles={noop} />,
  'equipped title + long English name': () => <HomePlayerActions player={{ ...player, name: 'Alexandria Catherine Montgomery-Wellington', equippedTitle: 'album' }} likes={{ ...likes, view: { ...likes.view!, receivedLikes: 12345 } }} onProfile={noop} onClockOut={noop} onTitles={noop} />,
  zero: () => <HomePlayerActions player={player} likes={{ ...likes, view: { ...likes.view!, receivedLikes: 0 } }} onProfile={noop} onClockOut={noop} />,
  loading: () => <HomePlayerActions player={player} likes={{ ...likes, view: null, loading: true }} onProfile={noop} onClockOut={noop} />,
  error: () => <HomePlayerActions player={player} likes={{ ...likes, view: null, error: 'load' }} onProfile={noop} onClockOut={noop} />,
} };
export default entry;
