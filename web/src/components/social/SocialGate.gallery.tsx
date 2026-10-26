import type { GalleryEntry } from '../../dev/gallery/types';
import { SocialGate } from './SocialGate';
export default {
  name: 'SocialGate',
  group: 'components',
  states: { default: () => <SocialGate onContinue={() => {}} onBack={() => {}} onInfo={() => {}} /> },
} satisfies GalleryEntry;
