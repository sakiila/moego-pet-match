import type { AchievementId, AchievementView, Faction, FactionState, PlayerLikesView, PlayerPet, PlayerProfileView, PawBookView, PawMessage, PawNotices, GameMove, LiveMoveResponse } from './types';
import { isGalleryPath } from '../app/entryRoute';
import type { CollectionView, ColleagueResult, DailyManager, DeletionRequestView, MyPet, PetDetail, GameMode, LeaderboardScope, LeaderboardView, PlayerView, QuizResult, RegisteredGame, ResultPayload, SettleResponse, VersionInfo } from './types';

/**
 * 接口错误分类：not_found（确定不存在）与 unavailable（网络或服务暂时不可用）分开，
 * 界面据此区分「没找到」与「读取失败，请重试」。
 */
export class ApiError extends Error {
  constructor(
    readonly kind: 'not_found' | 'unavailable' | 'invalid' | 'conflict' | 'unauthorized' | 'verification_failed' | 'rate_limited',
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
  if (res.status === 403 && body.error === 'verification_failed') throw new ApiError('verification_failed');
  if (res.status === 404) throw new ApiError('not_found', body.detail);
  if (res.status === 409) throw new ApiError('conflict', body.detail ?? body.error);
  if (res.status === 401 || (res.status === 403 && body.error === 'identity_mismatch')) {
    if (body.error === 'login_required' || body.error === 'identity_mismatch') window.dispatchEvent(new Event('pet-match:login-required'));
    throw new ApiError('unauthorized', body.error);
  }
  if (res.status === 429) throw new ApiError('rate_limited', body.error);
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
  if (res.status === 401 || (res.status === 403 && error === 'identity_mismatch')) window.dispatchEvent(new Event('pet-match:login-required'));
  if (res.status === 413 || error === 'too_large') throw new UploadError('too_large');
  if (res.status === 415 || error === 'unsupported_type') throw new UploadError('invalid_photo');
  if (res.status === 429 || error === 'daily_limit') throw new UploadError('daily_limit');
  if (error === 'name_required') throw new UploadError('name_required');
  if (error === 'quote_not_english') throw new UploadError('quote_not_english');
  throw new UploadError('failed');
}

/** 爪印动作超时后由控制器重新读取，处理已落库但响应丢失的情况。 */
function pawRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  return request<T>(path, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

const gameTokens = new Map<string, string>();

export const api = {
  getGameSecurity: () => request<{ enabled: boolean; siteKey?: string }>('/api/game-security'),
  startGame: async (gameId: string, playerId: string, turnstileToken: string, playToken: string) => {
    const result = await request<{ startedAt: string }>(`/api/games/${encodeURIComponent(gameId)}/start`, {
      method: 'POST', headers: { authorization: `Bearer ${playToken}` }, body: JSON.stringify({ playerId, turnstileToken }),
    });
    gameTokens.set(gameId, playToken);
    if (gameTokens.size > 8) gameTokens.delete(gameTokens.keys().next().value!);
    return result;
  },
  /** 服务端执棋：提交一次交换，取回服务端结算的棋局与时间线；同一步重试幂等。 */
  playMove: (gameId: string, playerId: string, index: number, move: GameMove) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6_000);
    return request<LiveMoveResponse>(`/api/games/${encodeURIComponent(gameId)}/moves`, {
      method: 'POST', headers: { authorization: `Bearer ${gameTokens.get(gameId) ?? ''}` }, body: JSON.stringify({ playerId, index, move }), signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  },
  getLoginState: (playerId: string, signal?: AbortSignal) => request<ColleagueResult & { hasPin: boolean }>(`/api/auth/players/${encodeURIComponent(playerId)}`, { signal }),
  signIn: (playerId: string, pin: string, confirmation?: string) => request<{ userId: string }>(`/api/auth/${confirmation === undefined ? 'login' : 'setup'}`, {
    method: 'POST', body: JSON.stringify({ playerId, pin, ...(confirmation === undefined ? {} : { confirmation }) }),
  }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST', body: '{}' }),
  getPawBook: (petId: string, playerId: string, cursor?: string | null) => pawRequest<PawBookView>(
    `/api/pets/${encodeURIComponent(petId)}/paws?playerId=${encodeURIComponent(playerId)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
  changePaw: (petId: string, playerId: string, message: PawMessage | null, version: number, limit = 20) => pawRequest<PawBookView>(
    `/api/pets/${encodeURIComponent(petId)}/paws`, { method: 'PUT', body: JSON.stringify({ playerId, message, version, limit }) }),
  replyPaw: (petId: string, playerId: string, id: string, version: number, limit = 20) => pawRequest<PawBookView>(
    `/api/pets/${encodeURIComponent(petId)}/paws/${encodeURIComponent(id)}/reply`, { method: 'POST', body: JSON.stringify({ playerId, version, limit }) }),
  readPaws: (petId: string, playerId: string, ids: string[], kind: 'message' | 'reply') => pawRequest<{ ok: true }>(
    `/api/pets/${encodeURIComponent(petId)}/paws/read`, { method: 'POST', body: JSON.stringify({ playerId, ids, kind }) }),
  getPawNotices: (playerId: string) => pawRequest<PawNotices>(`/api/players/${encodeURIComponent(playerId)}/paw-notices`),
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
  getFaction: (playerId: string) => request<FactionState>(`/api/faction?playerId=${encodeURIComponent(playerId)}`),
  joinFaction: (playerId: string, faction: Faction) =>
    request<FactionState>('/api/faction/join', { method: 'POST', body: JSON.stringify({ playerId, faction }) }),
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
      headers: gameTokens.has(gameId) ? { authorization: `Bearer ${gameTokens.get(gameId)}` } : undefined,
      body: JSON.stringify({ playerId, result }),
    }),
};
