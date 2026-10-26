import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { createSocialFixtures, previewViewer } from '../../dev/social/fixtures';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { SocialDialogs, type SocialOverlay } from './SocialDialogs';
function Example({ initial }: { initial: SocialOverlay }) {
  const { t } = useI18n();
  const [overlay, setOverlay] = useState<SocialOverlay | null>(null);
  return (
    <>
      <Button onClick={() => setOverlay(initial)}>{t('social.more')}</Button>
      {overlay && (
        <SocialDialogs
          overlay={overlay}
          viewerId={previewViewer.id}
          onClose={() => setOverlay(null)}
          onChoose={setOverlay}
          onConfirm={() => setOverlay(null)}
          onFeedback={() => setOverlay(null)}
        />
      )}
    </>
  );
}
export default {
  name: 'SocialDialogs',
  group: 'components',
  states: {
    own: () => <Example initial={{ kind: 'menu', post: createSocialFixtures().posts[1] }} />,
    other: () => <Example initial={{ kind: 'menu', post: createSocialFixtures().posts[0] }} />,
    delete: () => <Example initial={{ kind: 'remove', post: createSocialFixtures().posts[1] }} />,
    hide: () => <Example initial={{ kind: 'remove', post: createSocialFixtures().posts[2] }} />,
    discard: () => <Example initial={{ kind: 'discard', leave: 'back' }} />,
    info: () => <Example initial={{ kind: 'info' }} />,
    feedback: () => <Example initial={{ kind: 'feedback', post: createSocialFixtures().posts[0] }} />,
  },
} satisfies GalleryEntry;
