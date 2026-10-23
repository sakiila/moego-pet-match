import type { GalleryEntry } from '../dev/gallery/types';
import { IdentityScreen } from './IdentityScreen';

const noop = () => {};
const found = async () => [
  { userId: 'U1', name: 'Bob' },
  { userId: 'U2', name: 'Bobby Tables' },
];

const entry: GalleryEntry = {
  name: 'IdentityScreen',
  group: 'screens',
  states: {
    empty: () => <IdentityScreen onConfirm={noop} search={found} />,
    results: () => <IdentityScreen onConfirm={noop} search={found} initialQuery="bob" />,
    loading: () => <IdentityScreen onConfirm={noop} search={() => new Promise(() => {})} initialQuery="bob" />,
    'not found': () => <IdentityScreen onConfirm={noop} search={async () => []} initialQuery="nobody" />,
    'load failed': () => <IdentityScreen onConfirm={noop} search={() => Promise.reject(new Error('down'))} initialQuery="bob" />,
  },
};

export default entry;
