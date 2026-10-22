import type { GalleryEntry } from '../../dev/gallery/types';
import { SettingsDialog } from './SettingsDialog';

const entry: GalleryEntry = {
  name: 'SettingsDialog',
  group: 'components',
  states: { open: () => <SettingsDialog open inline onClose={() => {}} /> },
};

export default entry;
