/** 编码变化时同时更新 URL 与服务端磁盘缓存键，避免复用旧的 immutable 图片。 */
export const STICKER_WEBP_VERSION = 'q85-v2';
export const STICKER_WEBP_QUERY = `format=webp&v=${STICKER_WEBP_VERSION}`;
export const STICKER_SIZES = [128, 512, 1024] as const;

export function stickerImageUrl(kind: 'pets' | 'fish', id: string, size: typeof STICKER_SIZES[number]) {
  return `/img/${kind}/${encodeURIComponent(id)}/${size}?${STICKER_WEBP_QUERY}`;
}
