import type { AchievementId, AchievementView, PlayerLikesView, PlayerPet, PlayerProfileView } from './types';
import { isGalleryPath } from '../app/entryRoute';
import type { CollectionView, ColleagueResult, DailyManager, DeletionRequestView, MyPet, PetDetail, GameMode, LeaderboardScope, LeaderboardView, PlayerView, QuizResult, RegisteredGame, ResultPayload, SettleResponse, VersionInfo } from './types';

/**
 * 接口错误分类：not_found（确定不存在）与 unavailable（网络或服务暂时不可用）分开，
 * 界面据此区分「没找到」与「读取失败，请重试」。
 */
export class ApiError extends Error {
  constructor(
    readonly kind: 'not_found' | 'unavailable' | 'invalid' | 'conflict',
    readonly detail?: string,
  ) {
    super(kind);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Gallery renders fixtures; even GET identity/achievement endpoints can write progress.
  if (isGalleryPath(globalThis.location?.pathname ?? '')) throw new ApiError('invalid', 'gallery_preview');
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  } catch {
    throw new ApiError('unavailable');
  }
  if (res.ok) return (await res.json()) as T;
  const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
  if (res.status === 404) throw new ApiError('not_found', body.detail);
  if (res.status === 409) throw new ApiError('conflict', body.detail);
  if (res.status === 400 || res.status === 422) throw new ApiError('invalid', body.detail ?? body.error);
  throw new ApiError('unavailable', body.detail);
}

/** 上传失败的原因，对应 UI_COPY 9.1 的提示文案。 */
export type UploadErrorKind = 'too_large' | 'invalid_photo' | 'daily_limit' | 'name_required' | 'quote_not_english' | 'failed';

export class UploadError extends Error {
  constructor(readonly kind: UploadErrorKind) {
    super(kind);
  }
}

/** 用 XHR 发 multipart：fetch 拿不到上传进度。网络错误、超时与中止都归为 null。 */
function postForm(url: string, body: FormData, onProgress?: (fraction: number) => void): Promise<{ status: number; text: string } | null> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (onProgress) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
    xhr.onerror = xhr.ontimeout = xhr.onabort = () => resolve(null);
    xhr.send(body);
  });
}

/** 上传照片：multipart 发送（照片已在页面里缩好，解码不了的为原图）；把服务端错误码映射成提示类别。 */
async function submitPet(
  playerId: string,
  petName: string,
  ownerQuote: string,
  photo: File,
  onProgress?: (fraction: number) => void,
): Promise<{ submissionId: string }> {
  if (isGalleryPath(globalThis.location?.pathname ?? '')) throw new UploadError('failed');
  const body = new FormData();
  body.append('playerId', playerId);
  body.append('petName', petName);
  if (ownerQuote) body.append('ownerQuote', ownerQuote);
  body.append('photo', photo, photo.name);
  const res = await postForm('/api/submissions', body, onProgress);
  if (!res) throw new UploadError('failed');
  const json = (() => {
    try {
      return JSON.parse(res.text) as { submissionId?: string; error?: string };
    } catch {
      return {};
    }
  })();
  if (res.status >= 200 && res.status < 300 && json.submissionId) return { submissionId: json.submissionId };
  const { error } = json;
  if (res.status === 413 || error === 'too_large') throw new UploadError('too_large');
  if (res.status === 415 || error === 'unsupported_type') throw new UploadError('invalid_photo');
  if (res.status === 429 || error === 'daily_limit') throw new UploadError('daily_limit');
  if (error === 'name_required') throw new UploadError('name_required');
  if (error === 'quote_not_english') throw new UploadError('quote_not_english');
  throw new UploadError('failed');
}

export const api = {
  getPlayerPets: (ownerId: string, viewerId: string, signal?: AbortSignal) => request<{ pets: PlayerPet[] }>(`/api/players/${encodeURIComponent(ownerId)}/pets?viewerId=${encodeURIComponent(viewerId)}`, { signal }).then(view => view.pets),
  getPlayerLikes: (targetId: string, viewerId: string, signal?: AbortSignal) => request<PlayerLikesView>(`/api/players/${encodeURIComponent(targetId)}/likes?viewerId=${encodeURIComponent(viewerId)}`, { signal }),
  likePlayer: (targetId: string, playerId: string) => request<PlayerLikesView>(`/api/players/${encodeURIComponent(targetId)}/likes`, { method: 'POST', body: JSON.stringify({ playerId }) }),
  getPlayerProfile: (playerId: string, mode: GameMode, signal?: AbortSignal) => request<PlayerProfileView>(`/api/players/${encodeURIComponent(playerId)}/profile?mode=${mode}`, {signal}),
  submitPet,
  getAchievements: (playerId: string) => request<AchievementView>(`/api/players/${encodeURIComponent(playerId)}/achievements`),
  equipTitle: (playerId: string, title: AchievementId | null) => request<AchievementView>(`/api/players/${encodeURIComponent(playerId)}/title`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  searchRoster: (q: string, signal?: AbortSignal) =>
    request<{ results: ColleagueResult[] }>(`/api/roster?q=${encodeURIComponent(q)}`, { signal }).then((r) => r.results),
  getPlayer: (userId: string) => request<PlayerView>(`/api/players/${encodeURIComponent(userId)}`),
  registerGame: (playerId: string, mode: GameMode) =>
    request<RegisteredGame>('/api/games', { method: 'POST', body: JSON.stringify({ playerId, mode }) }),
  getLeaderboard: (mode: GameMode, playerId: string, scope: LeaderboardScope = 'all') =>
    request<LeaderboardView>(`/api/leaderboard?mode=${mode}&scope=${scope}&playerId=${encodeURIComponent(playerId)}`),
  answerQuiz: (quizId: string, playerId: string, choice: string | null) =>
    request<QuizResult>(`/api/quizzes/${encodeURIComponent(quizId)}/answer`, { method: 'POST', body: JSON.stringify({ playerId, choice }) }),
  getCollection: (playerId: string) => request<CollectionView>(`/api/pets?playerId=${encodeURIComponent(playerId)}`),
  getPetDetail: (petId: string, playerId: string) =>
    request<PetDetail>(`/api/pets/${encodeURIComponent(petId)}?playerId=${encodeURIComponent(playerId)}`),
  getManager: () => request<DailyManager>('/api/manager'),
  getVersion: () => request<VersionInfo>('/api/version'),
  getMyPets: (playerId: string) => request<{ pets: MyPet[] }>(`/api/my-pets?playerId=${encodeURIComponent(playerId)}`).then((r) => r.pets),
  getDeletionRequests: (playerId: string) =>
    request<{ requests: DeletionRequestView[] }>(`/api/deletion-requests?playerId=${encodeURIComponent(playerId)}`).then((r) => r.requests),
  /** 提交删除申请；petId 为 null 为一般申请。提交只记为待处理，不自动下架。 */
  requestDeletion: (playerId: string, petId: string | null, note: string) =>
    request<{ requestId: string; status: 'pending' }>('/api/deletion-requests', { method: 'POST', body: JSON.stringify({ playerId, petId, note }) }),
  submitResult: (gameId: string, playerId: string, result: ResultPayload) =>
    request<SettleResponse>(`/api/games/${encodeURIComponent(gameId)}/result`, {
      method: 'POST',
      body: JSON.stringify({ playerId, result }),
    }),
};
