import type { GalleryEntry } from '../../dev/gallery/types';
import { SocialEmpty, SocialHeader, SocialLanguage, SocialIdentity } from './SocialChrome';
export default {
  name: 'SocialChrome',
  group: 'components',
  states: {
    default: () => (
      <SocialHeader onBack={() => {}} backHome>
        <SocialLanguage />
        <SocialIdentity name="Bob" onOpen={() => {}} />
      </SocialHeader>
    ),
    empty: () => <SocialEmpty onCreate={() => {}} />,
    loading: () => <SocialEmpty state="loading" />,
    error: () => <SocialEmpty state="error" onRetry={() => {}} />,
  },
} satisfies GalleryEntry;
