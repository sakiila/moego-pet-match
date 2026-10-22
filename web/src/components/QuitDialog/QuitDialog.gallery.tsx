import type { GalleryEntry } from '../../dev/gallery/types';
import { QuitDialog } from './QuitDialog';

const noop = () => {};

const entry: GalleryEntry = {
  name: 'QuitDialog',
  group: 'components',
  states: { open: () => <QuitDialog open inline onConfirm={noop} onCancel={noop} /> },
};

export default entry;
