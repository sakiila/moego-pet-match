import type { GalleryEntry } from '../../dev/gallery/types';
import { createSocialFixtures, previewViewer } from '../../dev/social/fixtures';
import { SocialPostCard } from './SocialPostCard';
const post = createSocialFixtures().posts[0];
const callbacks = {
  viewerId: previewViewer.id,
  onOpen: () => {},
  onPhoto: () => {},
  onMenu: () => {},
  onReaction: () => {},
};
export default {
  name: 'SocialPostCard',
  group: 'components',
  states: {
    default: () => <SocialPostCard post={post} {...callbacks} />,
    detail: () => <SocialPostCard post={post} detail {...callbacks} />,
    'text only / long English name': () => (
      <SocialPostCard
        post={{
          ...post,
          photos: [],
          author: { id: 'long', name: 'Alexandria Catherine Montgomery-Wellington' },
          body: 'A very small moment in a very busy day. '.repeat(12),
        }}
        {...callbacks}
      />
    ),
    native: () => <SocialPostCard post={createSocialFixtures().posts[1]} {...callbacks} />,
  },
} satisfies GalleryEntry;
