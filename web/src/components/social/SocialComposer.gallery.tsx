import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { createSocialFixtures, previewPets, previewViewer } from '../../dev/social/fixtures';
import { SocialComposer } from './SocialComposer';
function Example({
  photos = false,
  processing = false,
  publishing = false,
  error = false,
  long = false,
}: {
  photos?: boolean;
  processing?: boolean;
  publishing?: boolean;
  error?: boolean;
  long?: boolean;
}) {
  const [draft, setDraft] = useState({
    body: photos ? '今天也在认真晒太阳。' : '',
    photos: photos ? createSocialFixtures().posts[1].photos : [],
    petId: '',
  });
  return (
    <SocialComposer
      {...draft}
      author={long ? { id: 'long', name: 'Alexandria Catherine Montgomery-Wellington' } : previewViewer}
      pets={previewPets}
      processing={processing}
      publishing={publishing}
      error={error ? 'Demo: photo could not be read.' : undefined}
      onBody={(body) => setDraft((d) => ({ ...d, body }))}
      onPet={(petId) => setDraft((d) => ({ ...d, petId }))}
      onRemovePhoto={(id) => setDraft((d) => ({ ...d, photos: d.photos.filter((p) => p.id !== id) }))}
      onFiles={() => {}}
    />
  );
}
export default {
  name: 'SocialComposer',
  group: 'components',
  states: {
    empty: () => <Example />,
    'photos / selected': () => <Example photos />,
    processing: () => <Example photos processing />,
    publishing: () => <Example photos publishing />,
    error: () => <Example photos error />,
    'long English name': () => <Example photos long />,
  },
} satisfies GalleryEntry;
