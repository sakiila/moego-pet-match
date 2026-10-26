import type { GalleryEntry } from '../../dev/gallery/types';
import { createSocialFixtures } from '../../dev/social/fixtures';
import { SocialActivity } from './SocialActivity';
const state = createSocialFixtures();
export default {
  name: 'SocialActivity',
  group: 'components',
  states: {
    default: () => <SocialActivity notices={state.notices} posts={state.posts} onOpen={() => {}} />,
    empty: () => <SocialActivity notices={[]} posts={[]} onOpen={() => {}} />,
    read: () => (
      <SocialActivity
        notices={state.notices.map((n) => ({ ...n, read: true }))}
        posts={state.posts}
        onOpen={() => {}}
      />
    ),
  },
} satisfies GalleryEntry;
