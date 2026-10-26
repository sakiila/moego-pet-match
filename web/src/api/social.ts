import { isGalleryPath } from '../app/entryRoute';
import type { SocialComment, SocialNotice, SocialPerson, SocialPet, SocialPhoto, SocialPost } from '../social/model';
import { resizeSocialPhoto } from '../social/photos';

export class SocialApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}
export interface SocialSession {
  viewer: SocialPerson;
  pets: SocialPet[];
  canModerate: boolean;
  unreadCount: number;
}
export interface PostPage {
  posts: SocialPost[];
  nextCursor: string | null;
}
export interface NoticePage {
  notices: SocialNotice[];
  nextCursor: string | null;
  unreadCount: number;
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (isGalleryPath(location.pathname)) throw new SocialApiError(400, 'gallery_preview');
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(init?.body instanceof FormData ? 60000 : 20000),
      headers: {
        ...(init?.body === undefined || init.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
        ...init?.headers,
      },
    });
  } catch {
    throw new SocialApiError(0, 'network_error');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('pet-match:login-required'));
    throw new SocialApiError(response.status, data.error ?? 'unavailable');
  }
  return data as T;
}
const post = (id: string) => `/api/social/posts/${encodeURIComponent(id)}`;
export const socialApi = {
  config: () => request<{ enabled: boolean }>('/api/social/config'),
  session: () => request<SocialSession>('/api/social/session'),
  posts: (scope: 'all' | 'mine' = 'all', source: 'native' | 'slack' = 'native', cursor?: string | null) =>
    request<PostPage>(
      `/api/social/posts?scope=${scope}&source=${source}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    ),
  post: (id: string) => request<SocialPost>(post(id)),
  async publish(value: SocialPost) {
    const input = {
      id: value.id,
      body: value.body,
      photoIds: value.photos.map((p) => p.id),
      petId: value.pet?.id ?? null,
    };
    try {
      return await request<SocialPost>('/api/social/posts', { method: 'POST', body: JSON.stringify(input) });
    } catch (error) {
      // 发布回应丢失时，先尝试找回同一个 ID，避免用户重试生成重复动态。
      if (error instanceof SocialApiError && (error.status === 0 || error.status >= 500)) {
        try {
          const saved = await socialApi.post(value.id);
          if (
            saved.body === value.body.trim() &&
            saved.photos.map((p) => p.id).join() === input.photoIds.join() &&
            (saved.pet?.id ?? null) === input.petId
          )
            return saved;
        } catch {
          /* 保留原始失败，让表单继续重试。 */
        }
      }
      throw error;
    }
  },
  reaction: (id: string, kind: string, selected: boolean) =>
    request<SocialPost>(`${post(id)}/reactions/${kind}`, { method: 'PUT', body: JSON.stringify({ selected }) }),
  comment: (id: string, value: SocialComment) =>
    request<SocialPost>(`${post(id)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ id: value.id, body: value.body, replyToUserId: value.replyTo?.id ?? null }),
    }),
  deleteComment: (id: string, commentId: string) =>
    request<SocialPost>(`${post(id)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' }),
  remove: (id: string) => request<{ ok: true; unreadCount: number }>(post(id), { method: 'DELETE' }),
  comments: (id: string, cursor: string) =>
    request<{ comments: SocialComment[]; nextCursor: string | null }>(
      `${post(id)}/comments?cursor=${encodeURIComponent(cursor)}`,
    ),
  notices: (cursor?: string | null) =>
    request<NoticePage>(`/api/social/notices${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
  read: (id?: string) =>
    request<{ unreadCount: number }>('/api/social/notices/read', { method: 'POST', body: JSON.stringify({ id }) }),
  report: (postId: string, body: string) =>
    request('/api/social/reports', { method: 'POST', body: JSON.stringify({ id: crypto.randomUUID(), postId, body }) }),
  async upload(file: File): Promise<SocialPhoto> {
    const form = new FormData();
    form.append('photo', await resizeSocialPhoto(file), 'photo.jpg');
    const photo = await request<SocialPhoto>('/api/social/media', { method: 'POST', body: form });
    return { ...photo, alt: file.name };
  },
  release: (photo: SocialPhoto) => request(`/api/social/media/${encodeURIComponent(photo.id)}`, { method: 'DELETE' }),
};
