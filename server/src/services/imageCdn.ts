import { stickerImageUrl, STICKER_SIZES } from '../../../web/src/game/stickerImage.ts';

const ORIGIN = 'https://star.baobo.me';
export type PurgeStickerImages = (id: string, kind?: 'pets' | 'fish') => Promise<void>;

/** CDN 规则只匹配这些精确的查询参数；不清理照片、API 或其他子域名。 */
export function stickerPurgeUrls(id: string, kind: 'pets' | 'fish' = 'pets'): string[] {
  return STICKER_SIZES.map(size => new URL(stickerImageUrl(kind, id, size), ORIGIN).href);
}

export function createImageCdnPurger(env: Record<string, string | undefined> = process.env, fetchImpl: typeof fetch = fetch): PurgeStickerImages {
  const zone = env.CLOUDFLARE_ZONE_ID;
  const token = env.CLOUDFLARE_API_TOKEN;
  if (!zone || !/^[a-f0-9]{32}$/i.test(zone) || !token?.trim()) {
    throw new Error('CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN (baobo.me Cache Purge only) are required for production image purges');
  }
  return async (id, kind = 'pets') => {
    const response = await fetchImpl(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ files: stickerPurgeUrls(id, kind) }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => null) as { success?: boolean } | null;
    if (!response.ok || body?.success !== true) throw new Error(`Cloudflare image purge failed (HTTP ${response.status})`);
  };
}
