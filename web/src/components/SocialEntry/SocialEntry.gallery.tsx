import type { GalleryEntry } from '../../dev/gallery/types';
import { SocialEntry } from './SocialEntry';
export default {
  name: 'SocialEntry',
  group: 'components',
  states: { default: () => <SocialEntry onOpen={() => {}} /> },
} satisfies GalleryEntry;
