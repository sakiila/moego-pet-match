import type { GalleryEntry } from '../../dev/gallery/types';
import { SocialEmpty, SocialHeader } from './SocialChrome';
const identity = { name: 'Bob', onOpen: () => {} };
export default {
  name: 'SocialChrome',
  group: 'components',
  states: {
    default: () => (
      <SocialHeader title="毛孩子动态" onHome={() => {}} identity={identity}>
        <button>＋ 发布</button>
      </SocialHeader>
    ),
    subpage: () => (
      <SocialHeader title="动态详情" onHome={() => {}} identity={identity} back={{ label: '返回消息', onClick: () => {} }} />
    ),
    longEnglish: () => (
      <SocialHeader
        title="Alexandria Catherine's Pet Moment"
        onHome={() => {}}
        identity={{ name: 'Alexandria Catherine Montgomery-Wellington', onOpen: () => {} }}
        back={{ label: 'Back to activity', onClick: () => {} }}
      />
    ),
    empty: () => <SocialEmpty onCreate={() => {}} />,
    loading: () => <SocialEmpty state="loading" />,
    error: () => <SocialEmpty state="error" onRetry={() => {}} />,
  },
} satisfies GalleryEntry;
