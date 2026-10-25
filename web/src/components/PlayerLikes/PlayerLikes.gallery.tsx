import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import type { PlayerLikesState } from '../../game/playerLikes';
import { PlayerLikesPill, PlayerLikesRow } from './PlayerLikes';

const noop = () => {};
const base: PlayerLikesState = { view: { receivedLikes: 12, likedByViewer: false, canLike: true }, loading: false, sending: false, error: null, celebration: 0 };
function Interactive() {
  const [state, setState] = useState(base);
  return <PlayerLikesRow state={state} onLike={() => setState({ ...base, view: { receivedLikes: 13, likedByViewer: true, canLike: false }, celebration: 1 })} onRetry={noop} />;
}
const row = (state = base, own = false) => <PlayerLikesRow state={state} own={own} onLike={noop} onRetry={noop} />;
const entry: GalleryEntry = { name: 'PlayerLikes', group: 'components', states: {
  'default · press / success / permanent': () => <Interactive />,
  liked: () => row({ ...base, view: { receivedLikes: 13, likedByViewer: true, canLike: false } }),
  'own · read only': () => row({ ...base, view: { ...base.view!, canLike: false } }, true),
  zero: () => row({ ...base, view: { ...base.view!, receivedLikes: 0 } }),
  'large count · English wrapping': () => row({ ...base, view: { ...base.view!, receivedLikes: 1234567 } }),
  loading: () => row({ ...base, view: null, loading: true }),
  sending: () => row({ ...base, sending: true }),
  'read error': () => row({ ...base, view: null, error: 'load' }),
  'send error · confirmed count retained': () => row({ ...base, error: 'send' }),
  'home pill': () => <PlayerLikesPill state={base} onOpen={noop} />,
  'home pill · zero': () => <PlayerLikesPill state={{ ...base, view: { ...base.view!, receivedLikes: 0 } }} onOpen={noop} />,
  'home pill · loading': () => <PlayerLikesPill state={{ ...base, view: null, loading: true }} onOpen={noop} />,
} };
export default entry;
