/**
 * Slack 实时目录：独立同事名册的来源，也用于搜索补缺。
 * users.list 分页读取后在内存缓存，搜索与按 ID 取人都只查缓存；缓存过期后下一次请求才重新拉取。
 * 过滤条件与 pet_match.colleagues 一致，并排除访客、Slackbot。
 */
export interface SlackMember {
  userId: string;
  name: string;
  email: string | null;
}

export interface SlackDirectory {
  search(q: string): Promise<SlackMember[]>;
  get(userId: string): Promise<SlackMember | null>;
}

export interface FullSlackDirectory extends SlackDirectory {
  all(): Promise<SlackMember[]>;
}

const WORKSPACE_ID = 'T011CF3CMJN';
const PAGE_SIZE = 200;
const MAX_PAGES = 50;

interface RawUser {
  id: string;
  team_id?: string;
  name?: string;
  deleted?: boolean;
  is_bot?: boolean;
  is_restricted?: boolean;
  is_ultra_restricted?: boolean;
  profile?: { email?: string; real_name?: string; real_name_normalized?: string; display_name?: string };
}

export function toMember(u: RawUser): SlackMember | null {
  if (u.deleted || u.is_bot || u.is_restricted || u.is_ultra_restricted || u.id === 'USLACKBOT') return null;
  const email = u.profile?.email ?? null;
  if (u.team_id !== WORKSPACE_ID && !email?.toLowerCase().endsWith('@moego.pet')) return null;
  const name = u.profile?.real_name_normalized || u.profile?.real_name || u.profile?.display_name || u.name;
  return name ? { userId: u.id, name, email } : null;
}

type Fetch = typeof fetch;

export function slackDirectory(
  token: string | undefined,
  options: { ttlMs?: number; fetchImpl?: Fetch; now?: () => number } = {},
): FullSlackDirectory | null {
  if (!token) return null;
  const ttl = options.ttlMs ?? 5 * 60_000;
  const doFetch = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  let cache: { at: number; members: SlackMember[] } | null = null;
  let inflight: Promise<SlackMember[]> | null = null;

  async function load(): Promise<SlackMember[]> {
    const members: SlackMember[] = [];
    let cursor = '';
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = `https://slack.com/api/users.list?limit=${PAGE_SIZE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const res = await doFetch(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
      const json = (await res.json()) as { ok?: boolean; error?: string; members?: RawUser[]; response_metadata?: { next_cursor?: string } };
      if (!json.ok) throw new Error(`slack users.list: ${json.error ?? res.status}`);
      if (!Array.isArray(json.members)) throw new Error('Slack directory response is missing members');
      for (const u of json.members ?? []) {
        const m = toMember(u);
        if (m) members.push(m);
      }
      cursor = json.response_metadata?.next_cursor ?? '';
      if (!cursor) break;
    }
    if (cursor) throw new Error('Slack directory pagination incomplete');
    return members;
  }

  async function members(force = false): Promise<SlackMember[]> {
    if (!force && cache && now() - cache.at < ttl) return cache.members;
    inflight ??= load()
      .then((list) => {
        cache = { at: now(), members: list };
        return list;
      })
      .finally(() => {
        inflight = null;
      });
    try {
      return await inflight;
    } catch (error) {
      // 刷新失败时继续用旧缓存，没有旧缓存才向上抛
      if (!force && cache) return cache.members;
      throw error;
    }
  }

  return {
    all: () => members(true),
    async search(q) {
      const needle = q.trim().toLowerCase();
      if (!needle) return [];
      return (await members()).filter(
        (m) => m.name.toLowerCase().includes(needle) || (m.email ?? '').toLowerCase().split('@')[0].startsWith(needle),
      );
    },
    async get(userId) {
      return (await members()).find((m) => m.userId === userId) ?? null;
    },
  };
}
