import { useRef, useState } from 'react';
import { SocialWall, type SocialPage } from '../../components/social/SocialWall';
import type { SocialLoadState } from '../../components/social/SocialChrome';
import type { SocialState } from '../../social/model';
import { createSocialFixtures, previewPets, previewViewer } from './fixtures';
import { readPreviewPhoto } from './photos';
import { previewActions } from './actions';

export function SocialGalleryPreview({
  page = { name: 'feed' },
  load = 'normal',
  longName = false,
}: {
  page?: SocialPage;
  load?: SocialLoadState;
  longName?: boolean;
}) {
  const [state, setState] = useState(createSocialFixtures);
  const current = useRef(state);
  return (
    <SocialWall
      state={state}
      viewer={longName ? { ...previewViewer, name: 'Alexandria Catherine Montgomery-Wellington' } : previewViewer}
      pets={previewPets}
      initialPage={page}
      initialState={load}
      onHome={() => {}}
      onReset={() => {
        const next = createSocialFixtures();
        current.current = next;
        setState(next);
      }}
      readPhoto={readPreviewPhoto}
      actions={previewActions(previewViewer, async (update: (value: SocialState) => SocialState) => {
        const next = update(current.current);
        current.current = next;
        setState(next);
      })}
    />
  );
}
