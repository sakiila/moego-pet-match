import type { SocialActions } from '../../social/actions';
import {
  addComment,
  deleteComment,
  markNoticesRead,
  publishPost,
  removePost,
  setReaction,
  type SocialPerson,
  type SocialState,
} from '../../social/model';
export function previewActions(
  viewer: SocialPerson,
  mutate: (update: (state: SocialState) => SocialState) => Promise<void>,
): SocialActions {
  return {
    async publish(post) {
      await mutate((s) => publishPost(s, post));
      return post;
    },
    reaction: (id, kind, selected) => mutate((s) => setReaction(s, id, viewer, kind, selected)),
    comment: (id, comment) => mutate((s) => addComment(s, id, comment)),
    deleteComment: (id, commentId) => mutate((s) => deleteComment(s, id, commentId, viewer.id)),
    remove: (id) => mutate((s) => removePost(s, id, viewer.id)),
    readNotices: (id) => mutate((s) => markNoticesRead(s, viewer.id, id)),
    report: (postId, body) =>
      mutate((s) => ({ ...s, reports: [...(s.reports ?? []), { postId, body, createdAt: new Date().toISOString() }] })),
  };
}
