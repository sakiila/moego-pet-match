import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { createSocialFixtures } from '../../dev/social/fixtures';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { SocialPhotoViewer } from './SocialPhotoViewer';
function Example() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <>
      <Button onClick={() => setOpen(true)}>{t('social.view_photo', { index: 1, count: 2 })}</Button>
      {open && (
        <SocialPhotoViewer post={createSocialFixtures().posts[1]} initialIndex={0} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
export default {
  name: 'SocialPhotoViewer',
  group: 'components',
  states: { default: () => <Example /> },
} satisfies GalleryEntry;
