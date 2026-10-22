import type { ColleagueResult, GameMode, LeaderboardView, PlayerView, RegisteredGame, ResultPayload, SettleResponse } from './types';

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

export const api = {
  searchRoster: (q: string, signal?: AbortSignal) =>
    request<{ results: ColleagueResult[] }>(`/api/roster?q=${encodeURIComponent(q)}`, { signal }).then((r) => r.results),
  getPlayer: (userId: string) => request<PlayerView>(`/api/players/${encodeURIComponent(userId)}`),
  registerGame: (playerId: string, mode: GameMode) =>
    request<RegisteredGame>('/api/games', { method: 'POST', body: JSON.stringify({ playerId, mode }) }),
  getLeaderboard: (mode: GameMode, playerId: string) =>
    request<LeaderboardView>(`/api/leaderboard?mode=${mode}&playerId=${encodeURIComponent(playerId)}`),
  submitResult: (gameId: string, playerId: string, result: ResultPayload) =>
    request<SettleResponse>(`/api/games/${encodeURIComponent(gameId)}/result`, {
      method: 'POST',
      body: JSON.stringify({ playerId, result }),
    }),
};
