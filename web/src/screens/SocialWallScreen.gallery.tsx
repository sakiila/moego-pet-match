import type { GalleryEntry } from '../dev/gallery/types';
import { SocialGalleryPreview } from '../dev/social/SocialGalleryPreview';
export default {
  name: 'SocialWallScreen',
  group: 'screens',
  states: {
    feed: () => <SocialGalleryPreview />,
    detail: () => <SocialGalleryPreview page={{ name: 'post', id: 'demo-slack-puppy' }} />,
    composer: () => <SocialGalleryPreview page={{ name: 'compose' }} />,
    activity: () => <SocialGalleryPreview page={{ name: 'activity' }} />,
    mine: () => <SocialGalleryPreview page={{ name: 'mine' }} />,
    gate: () => <SocialGalleryPreview page={{ name: 'gate' }} />,
    empty: () => <SocialGalleryPreview load="empty" />,
    loading: () => <SocialGalleryPreview load="loading" />,
    error: () => <SocialGalleryPreview load="error" />,
    removed: () => <SocialGalleryPreview page={{ name: 'post', id: 'removed' }} />,
    'long English name': () => <SocialGalleryPreview page={{ name: 'mine' }} longName />,
  },
} satisfies GalleryEntry;
