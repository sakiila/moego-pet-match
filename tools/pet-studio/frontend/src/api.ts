export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: init?.body instanceof FormData ? init.headers : { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('无法连接本机服务，请确认工作台服务正在运行。', 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail ?? body?.message;
    const message = typeof detail === 'string' ? detail : detail?.message;
    throw new ApiError(message || `请求失败（${response.status}），请稍后重试。`, response.status);
  }
  return response.json() as Promise<T>;
}

export const post = <T,>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });
