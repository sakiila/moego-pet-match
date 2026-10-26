import { describe, expect, it } from 'vitest';
import {
  addComment,
  deleteComment,
  emptyReactions,
  markNoticesRead,
  publishPost,
  removePost,
  setReaction,
  type SocialPost,
  type SocialState,
} from './model';

const owner = { id: 'owner', name: 'Owner' };
const visitor = { id: 'visitor', name: 'Visitor' };
function fixture(source: 'native' | 'slack' = 'native'): SocialState {
  const post: SocialPost = {
    id: 'post',
    author: owner,
    source,
    body: 'A photo moment',
    createdAt: '2026-10-26T00:00:00Z',
    photos: [{ id: 'photo', src: '/demo.jpg', alt: 'demo' }],
    reactions: emptyReactions(),
    comments: [],
  };
  return { version: 1, posts: [post], notices: [] };
}
describe('social preview interaction rules', () => {
  it('repeated selection counts once; removing it clears only that reaction and its notification', () => {
    const first = setReaction(fixture(), 'post', visitor, 'heart', true);
    expect(setReaction(first, 'post', visitor, 'heart', true)).toBe(first);
    const both = setReaction(first, 'post', visitor, 'bone', true);
    const undone = setReaction(both, 'post', visitor, 'heart', false);
    expect(undone.posts[0].reactions).toEqual({ paw: [], heart: [], bone: ['visitor'] });
    expect(undone.notices.map((n) => n.kind)).toEqual(['bone']);
    expect(first.posts[0].reactions.heart).toEqual(['visitor']);
  });
  it('does not notify a person about their own reaction', () => {
    expect(setReaction(fixture(), 'post', owner, 'paw', true).notices).toEqual([]);
  });
  it('publishing the same post twice is idempotent and rejects an empty or over-limit post', () => {
    const state = fixture();
    expect(publishPost(state, state.posts[0])).toBe(state);
    expect(() => publishPost(state, { ...state.posts[0], id: 'new', body: ' ', photos: [] })).toThrow();
    expect(() =>
      publishPost(state, {
        ...state.posts[0],
        id: 'new',
        photos: Array.from({ length: 10 }, () => state.posts[0].photos[0]),
      }),
    ).toThrow();
  });
  it('one-level replies notify the owner and replied-to person once without notifying the author', () => {
    const comment = {
      id: 'c',
      author: visitor,
      body: '  So cute!  ',
      createdAt: '2026-10-26T01:00:00Z',
      replyTo: { id: 'other', name: 'Other' },
    };
    const next = addComment(fixture(), 'post', comment);
    expect(next.posts[0].comments).toHaveLength(1);
    expect(next.posts[0].comments[0].body).toBe('So cute!');
    expect(next.notices.map((n) => n.recipientId).sort()).toEqual(['other', 'owner']);
    expect(addComment(next, 'post', comment)).toBe(next);
  });
  it('deduplicates a reply addressed to the post owner and rejects invalid comments', () => {
    const comment = { id: 'c', author: visitor, body: 'Hi', createdAt: '', replyTo: owner };
    expect(addComment(fixture(), 'post', comment).notices).toHaveLength(1);
    expect(() => addComment(fixture(), 'missing', comment)).toThrow();
    expect(() => addComment(fixture(), 'post', { ...comment, body: ' ' })).toThrow();
  });
  it('only the author can delete a post; deletion also clears associated interaction previews', () => {
    const liked = setReaction(fixture(), 'post', visitor, 'heart', true);
    expect(() => removePost(liked, 'post', visitor.id)).toThrow('forbidden');
    const removed = removePost(liked, 'post', owner.id);
    expect(removed.posts).toEqual([]);
    expect(removed.notices).toEqual([]);
  });
  it('hiding a synced post leaves a content-free tombstone and cannot receive new interactions', () => {
    const hidden = removePost(setReaction(fixture('slack'), 'post', visitor, 'bone', true), 'post', owner.id);
    expect(hidden.posts[0]).toMatchObject({
      hidden: true,
      body: '',
      photos: [],
      comments: [],
      reactions: emptyReactions(),
    });
    expect(hidden.notices).toEqual([]);
    expect(setReaction(hidden, 'post', visitor, 'paw', true)).toBe(hidden);
  });
  it('a person can only delete their own comment, and its notification is removed', () => {
    const commented = addComment(fixture(), 'post', { id: 'c', author: visitor, body: 'Hello', createdAt: '' });
    expect(() => deleteComment(commented, 'post', 'c', owner.id)).toThrow('forbidden');
    const next = deleteComment(commented, 'post', 'c', visitor.id);
    expect(next.posts[0].comments).toEqual([]);
    expect(next.notices).toEqual([]);
  });
  it('read receipts affect only the specified recipient', () => {
    const next = addComment(fixture(), 'post', {
      id: 'c',
      author: visitor,
      body: 'Hello',
      createdAt: '',
      replyTo: { id: 'other', name: 'Other' },
    });
    const read = markNoticesRead(next, owner.id);
    expect(read.notices.find((n) => n.recipientId === owner.id)?.read).toBe(true);
    expect(read.notices.find((n) => n.recipientId === 'other')?.read).toBe(false);
  });
});
