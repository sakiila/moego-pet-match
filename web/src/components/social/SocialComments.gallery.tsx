import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { createSocialFixtures, previewViewer } from '../../dev/social/fixtures';
import type { SocialPerson } from '../../social/model';
import { SocialComments, SocialCommentInput } from './SocialComments';
function Example({ empty = false }: { empty?: boolean }) {
  const [comments, setComments] = useState(empty ? [] : createSocialFixtures().posts[0].comments);
  const [replyTo, setReplyTo] = useState<SocialPerson>();
  return (
    <>
      <SocialComments
        comments={comments}
        viewerId={previewViewer.id}
        replyTo={replyTo}
        onReply={setReplyTo}
        onDelete={(id) => setComments((cs) => cs.filter((c) => c.id !== id))}
      />
      <SocialCommentInput
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(undefined)}
        onSend={async (body) => {
          setComments((cs) => [
            ...cs,
            { id: crypto.randomUUID(), author: previewViewer, body, replyTo, createdAt: new Date().toISOString() },
          ]);
          setReplyTo(undefined);
        }}
      />
    </>
  );
}
export default {
  name: 'SocialComments',
  group: 'components',
  states: { default: () => <Example />, empty: () => <Example empty /> },
} satisfies GalleryEntry;
