import type { SocialOptions } from './types.ts';
import { SOCIAL_MAX_BYTES } from './media.ts';

export type SlackSyncConfig = NonNullable<SocialOptions['sync']>;
export interface SlackFile {
  id: string;
  mimetype?: string;
  url_private?: string;
  size?: number;
  thumb_1024?: string;
  thumb_960?: string;
  is_external?: boolean;
  mode?: string;
  is_deleted?: boolean;
}
export interface SlackMessage {
  ts: string;
  user?: string;
  text?: string;
  thread_ts?: string;
  reply_count?: number;
  latest_reply?: string;
  bot_id?: string;
  subtype?: string;
  edited?: { ts: string };
  files?: SlackFile[];
}
export class SlackReadError extends Error {
  constructor(
    readonly code: string,
    readonly retryAfter = 60,
  ) {
    super(code);
  }
}
const nextRequest = new Map<string, number>();
const METHODS = ['conversations.history', 'conversations.replies', 'files.info', 'chat.getPermalink'] as const;

/** 仅提供读取方法；令牌不会出现在 URL，也不会传给外部文件主机。 */
export async function slackRead(
  config: SlackSyncConfig,
  method: (typeof METHODS)[number],
  params: Record<string, string>,
): Promise<Record<string, any>> {
  const key = `${config.teamId}:${method}`;
  const wait = Math.max(0, (nextRequest.get(key) ?? 0) - Date.now());
  if (wait) await new Promise((r) => setTimeout(r, wait));
  nextRequest.set(key, Date.now() + (config.requestGapMs ?? 1300));
  const url = new URL(`https://slack.com/api/${method}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const response = await (config.fetchImpl ?? fetch)(url.toString(), {
    headers: { authorization: `Bearer ${config.token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 429)
    throw new SlackReadError('ratelimited', Math.max(1, Number(response.headers.get('retry-after')) || 60));
  if (!response.ok) throw new SlackReadError(`http_${response.status}`);
  const json = (await response.json()) as Record<string, any>;
  if (!json.ok) throw new SlackReadError(typeof json.error === 'string' ? json.error : 'invalid_response');
  return json;
}
export async function fetchSlackPhoto(config: SlackSyncConfig, file: SlackFile): Promise<Buffer> {
  if (file.is_external || file.mode === 'external') throw new SlackReadError('external_file');
  const raw =
    (file.size ?? 0) > SOCIAL_MAX_BYTES
      ? (file.thumb_1024 ?? file.thumb_960)
      : (file.url_private ?? file.thumb_1024 ?? file.thumb_960);
  if (!raw) throw new SlackReadError('file_url_missing');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SlackReadError('invalid_file_host');
  }
  for (let redirects = 0; redirects < 4; redirects++) {
    if (
      url.protocol !== 'https:' ||
      !['files.slack.com', 'files-origin.slack.com'].includes(url.hostname) ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443')
    )
      throw new SlackReadError('invalid_file_host');
    const response = await (config.fetchImpl ?? fetch)(url.toString(), {
      headers: { authorization: `Bearer ${config.token}` },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const target = response.headers.get('location');
      if (!target) throw new SlackReadError('invalid_redirect');
      url = new URL(target, url);
      continue;
    }
    if (response.status === 429)
      throw new SlackReadError('ratelimited', Number(response.headers.get('retry-after')) || 60);
    if (response.status === 404 || response.status === 410) throw new SlackReadError('file_not_found');
    if (!response.ok || !response.body) throw new SlackReadError('file_download_failed');
    if (Number(response.headers.get('content-length')) > SOCIAL_MAX_BYTES) {
      await response.body.cancel();
      throw new SlackReadError('file_too_large');
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.length;
        if (bytes > SOCIAL_MAX_BYTES) {
          await reader.cancel();
          throw new SlackReadError('file_too_large');
        }
        chunks.push(part.value);
      }
    } finally {
      reader.releaseLock();
    }
    return Buffer.concat(chunks);
  }
  throw new SlackReadError('too_many_redirects');
}
