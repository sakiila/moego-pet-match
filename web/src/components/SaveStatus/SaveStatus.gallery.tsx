import type { SettleResponse } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import { PLACEHOLDER_PETS } from '../../game/pets';
import { SaveStatus } from './SaveStatus';

const noop = () => {};
const response = (over: Partial<SettleResponse> = {}): SettleResponse => ({
  gameId: 'g',
  score: 2480,
  personalBest: { previous: 1200, current: 2480, isNew: true },
  newCollected: [],
  progress: { completedNormalGames: 1, fishUnlocked: false, unlockedNow: false, counted: true },
  ...over,
});

const entry: GalleryEntry = {
  name: 'SaveStatus',
  group: 'components',
  states: {
    saving: () => <SaveStatus state={{ kind: 'saving' }} onRetry={noop} />,
    'saved · new best + collection': () => <SaveStatus state={{ kind: 'saved', response: response(), newPets: PLACEHOLDER_PETS.slice(0, 2) }} onRetry={noop} />,
    'saved · plain': () => (
      <SaveStatus state={{ kind: 'saved', response: response({ personalBest: { previous: 3000, current: 3000, isNew: false } }), newPets: [] }} onRetry={noop} />
    ),
    'saved · third game unlocks fish': () => (
      <SaveStatus
        state={{ kind: 'saved', response: response({ progress: { completedNormalGames: 3, fishUnlocked: true, unlockedNow: true, counted: true } }), newPets: [] }}
        onRetry={noop}
      />
    ),
    'retryable failure': () => <SaveStatus state={{ kind: 'retryable' }} onRetry={noop} />,
    'validation failed': () => <SaveStatus state={{ kind: 'invalid' }} onRetry={noop} />,
  },
};
export default entry;
