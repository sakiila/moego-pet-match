import type { ReactionKind, SocialComment, SocialPhoto, SocialPost } from './model';
export interface SocialActions {
  publish(post: SocialPost): Promise<SocialPost>;
  reaction(postId: string, kind: ReactionKind, selected: boolean): Promise<void>;
  comment(postId: string, comment: SocialComment): Promise<void>;
  deleteComment(postId: string, commentId: string): Promise<void>;
  remove(postId: string): Promise<void>;
  readNotices(noticeId?: string): Promise<void>;
  report(postId: string, body: string): Promise<void>;
  releasePhoto?(photo: SocialPhoto): Promise<void>;
  loadMine?(source: 'native' | 'slack'): Promise<void>;
  loadMorePosts?(scope: 'all' | 'mine', source: 'native' | 'slack'): Promise<void>;
  loadMoreNotices?(): Promise<void>;
  loadEarlierComments?(postId: string): Promise<void>;
}
