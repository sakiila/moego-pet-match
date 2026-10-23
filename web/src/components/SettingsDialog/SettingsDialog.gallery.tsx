import type { GalleryEntry } from '../../dev/gallery/types';
import { SettingsDialog } from './SettingsDialog';

const noop = () => {};
const first = { music: false, sfx: false, haptics: true };

const entry: GalleryEntry = {
  name: 'SettingsDialog',
  group: 'components',
  states: {
    'shop · first visit (sound off, haptics on)': () => <SettingsDialog open inline onClose={noop} preview={{ prefs: first, hapticsAvailable: true }} />,
    'shop · all on': () => <SettingsDialog open inline onClose={noop} preview={{ prefs: { music: true, sfx: true, haptics: true }, hapticsAvailable: true }} />,
    'haptics unavailable (iOS Safari)': () => <SettingsDialog open inline onClose={noop} preview={{ prefs: { music: false, sfx: true, haptics: false }, hapticsAvailable: false }} />,
    'board · three toggles only': () => <SettingsDialog open inline variant="board" onClose={noop} preview={{ prefs: first, hapticsAvailable: true }} />,
    'live (uses real preferences)': () => <SettingsDialog open inline onClose={noop} />,
  },
};
export default entry;
