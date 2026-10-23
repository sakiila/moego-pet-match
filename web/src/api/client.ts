import type { CollectionView, ColleagueResult, DailyManager, PetDetail, GameMode, LeaderboardView, PlayerView, QuizResult, RegisteredGame, ResultPayload, SettleResponse } from './types';

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
export type UploadErrorKind = 'too_large' | 'invalid_photo' | 'daily_limit' | 'name_required' | 'failed';

export class UploadError extends Error {
  constructor(readonly kind: UploadErrorKind) {
    super(kind);
  }
}

/** 上传照片：multipart 原样发送；把服务端错误码映射成提示类别。 */
async function submitPet(playerId: string, petName: string, photo: File): Promise<{ submissionId: string }> {
  const body = new FormData();
  body.append('playerId', playerId);
  body.append('petName', petName);
  body.append('photo', photo, photo.name);
  let res: Response;
  try {
    res = await fetch('/api/submissions', { method: 'POST', body });
  } catch {
    throw new UploadError('failed');
  }
  if (res.ok) return (await res.json()) as { submissionId: string };
  const { error } = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 413 || error === 'too_large') throw new UploadError('too_large');
  if (res.status === 415 || error === 'unsupported_type') throw new UploadError('invalid_photo');
  if (res.status === 429 || error === 'daily_limit') throw new UploadError('daily_limit');
  if (error === 'name_required') throw new UploadError('name_required');
  throw new UploadError('failed');
}

export const api = {
  submitPet,
  searchRoster: (q: string, signal?: AbortSignal) =>
    request<{ results: ColleagueResult[] }>(`/api/roster?q=${encodeURIComponent(q)}`, { signal }).then((r) => r.results),
  getPlayer: (userId: string) => request<PlayerView>(`/api/players/${encodeURIComponent(userId)}`),
  registerGame: (playerId: string, mode: GameMode) =>
    request<RegisteredGame>('/api/games', { method: 'POST', body: JSON.stringify({ playerId, mode }) }),
  getLeaderboard: (mode: GameMode, playerId: string) =>
    request<LeaderboardView>(`/api/leaderboard?mode=${mode}&playerId=${encodeURIComponent(playerId)}`),
  answerQuiz: (quizId: string, playerId: string, choice: string | null) =>
    request<QuizResult>(`/api/quizzes/${encodeURIComponent(quizId)}/answer`, { method: 'POST', body: JSON.stringify({ playerId, choice }) }),
  getCollection: (playerId: string) => request<CollectionView>(`/api/pets?playerId=${encodeURIComponent(playerId)}`),
  getPetDetail: (petId: string, playerId: string) =>
    request<PetDetail>(`/api/pets/${encodeURIComponent(petId)}?playerId=${encodeURIComponent(playerId)}`),
  getManager: () => request<DailyManager>('/api/manager'),
  submitResult: (gameId: string, playerId: string, result: ResultPayload) =>
    request<SettleResponse>(`/api/games/${encodeURIComponent(gameId)}/result`, {
      method: 'POST',
      body: JSON.stringify({ playerId, result }),
    }),
};
