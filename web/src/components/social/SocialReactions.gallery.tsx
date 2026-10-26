import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { emptyReactions } from '../../social/model';
import { SocialReactions } from './SocialReactions';
function Example({ selected = false, disabled = false }: { selected?: boolean; disabled?: boolean }) {
  const [reactions, setReactions] = useState(() => ({ ...emptyReactions(), play: selected ? ['demo'] : [] }));
  return (
    <SocialReactions
      reactions={reactions}
      viewerId="demo"
      disabled={disabled}
      commentCount={2}
      onComments={() => {}}
      onReaction={(kind, value) => setReactions((r) => ({ ...r, [kind]: value ? ['demo'] : [] }))}
    />
  );
}
export default {
  name: 'SocialReactions',
  group: 'components',
  states: {
    default: () => <Example />,
    selected: () => <Example selected />,
    'disabled / loading': () => <Example disabled />,
  },
} satisfies GalleryEntry;
