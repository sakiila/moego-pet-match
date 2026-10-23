import type { GalleryEntry } from '../../dev/gallery/types';
import { SaveStatus } from './SaveStatus';

const noop = () => {};

const entry: GalleryEntry = {
  name: 'SaveStatus',
  group: 'components',
  states: {
    saving: () => <SaveStatus state={{ kind: 'saving' }} onRetry={noop} />,
    'retryable failure': () => <SaveStatus state={{ kind: 'retryable' }} onRetry={noop} />,
    'validation failed': () => <SaveStatus state={{ kind: 'invalid' }} onRetry={noop} />,
  },
};
export default entry;
