import type { GalleryEntry } from '../../dev/gallery/types';
import { SocialAuthor } from './SocialAuthor';
const person = { id: 'U_DEMO', name: 'Bob' };
export default {
  name: 'SocialAuthor',
  group: 'components',
  states: {
    clickable: () => <SocialAuthor person={person} size={36} onOpen={() => {}}>今天 · 来自 Slack</SocialAuthor>,
    readOnly: () => <SocialAuthor person={person} size={36} />,
    longEnglish: () => (
      <SocialAuthor person={{ id: 'U_LONG', name: 'Alexandria Catherine Montgomery-Wellington' }} size={36} onOpen={() => {}}>
        Yesterday · From Slack
      </SocialAuthor>
    ),
  },
} satisfies GalleryEntry;
