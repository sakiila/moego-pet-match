export const SHARE_ORIGIN = 'https://star.baobo.me';
export const POSTER_URL = `${SHARE_ORIGIN}/og.jpg`;
export const POSTER_WIDTH = 1200;
export const POSTER_HEIGHT = 630;
export const PREVIEW_VARIANTS = ['og', 'twitter', 'oembed-photo', 'oembed-rich'] as const;
export type PreviewVariant = (typeof PREVIEW_VARIANTS)[number];

export function isPreviewVariant(value: unknown): value is PreviewVariant {
  return typeof value === 'string' && PREVIEW_VARIANTS.some((variant) => variant === value);
}

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => entities[char]);
const decodeHtml = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) =>
  Object.entries(entities).find(([, encoded]) => encoded === entity)?.[0] ?? entity);

export function previewMetadata(html: string) {
  const meta = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map((match) => [match[1].toLowerCase(), decodeHtml(match[3])]));
    if (attrs.property && attrs.content) meta.set(attrs.property, attrs.content);
  }
  return {
    title: meta.get('og:title') ?? 'MoeGo Pet All-Stars',
    alt: meta.get('og:image:alt') ?? meta.get('og:title') ?? 'MoeGo Pet All-Stars',
  };
}

export function previewPageUrl(requestUrl: string): URL {
  const url = new URL('/', SHARE_ORIGIN);
  const queryStart = requestUrl.indexOf('?');
  if (queryStart >= 0) url.search = requestUrl.slice(queryStart);
  return url;
}

/** 只生成固定首页海报，不抓取 url 指向的网页或站外资源。 */
export function supportedPreviewPage(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.origin === SHARE_ORIGIN && !url.username && !url.password && ['/', '/index.html'].includes(url.pathname) ? url : null;
  } catch { return null; }
}

export function renderPreviewHtml(html: string, variant: PreviewVariant, page: URL): string {
  let result = html.replace(/<link\b[^>]*>/gi, (tag) => /\btype=["']application\/json\+oembed["']/i.test(tag) ? '' : tag);
  if (variant !== 'twitter') result = result.replace(/<meta\b[^>]*\bname=(["'])twitter:[^"']*\1[^>]*>\s*/gi, '');
  result = result.replace(/<meta\b[^>]*\bproperty=(["'])og:url\1[^>]*>\s*/gi, '');
  const tags = [`<meta property="og:url" content="${escapeHtml(page.href)}" />`];
  if (variant.startsWith('oembed-')) {
    const discovery = new URL('/api/oembed', SHARE_ORIGIN);
    discovery.searchParams.set('url', page.href);
    discovery.searchParams.set('format', 'json');
    tags.push(`<link rel="alternate" type="application/json+oembed" href="${escapeHtml(discovery.href)}" title="${escapeHtml(previewMetadata(html).title)}" />`);
  }
  return result.replace(/<\/head>/i, `${tags.join('\n')}\n</head>`);
}

export function posterSize(maxwidth = POSTER_WIDTH, maxheight = POSTER_HEIGHT) {
  const scale = Math.min(1, maxwidth / POSTER_WIDTH, maxheight / POSTER_HEIGHT);
  return { width: Math.max(1, Math.round(POSTER_WIDTH * scale)), height: Math.max(1, Math.round(POSTER_HEIGHT * scale)) };
}

export function oEmbedRepresentation(page: URL, metadata: ReturnType<typeof previewMetadata>, maxwidth?: number, maxheight?: number) {
  const { width, height } = posterSize(maxwidth, maxheight);
  const image = new URL('/api/oembed/image', SHARE_ORIGIN);
  image.searchParams.set('maxwidth', String(maxwidth ?? POSTER_WIDTH));
  image.searchParams.set('maxheight', String(maxheight ?? POSTER_HEIGHT));
  const imageUrl = width === POSTER_WIDTH && height === POSTER_HEIGHT ? POSTER_URL : image.href;
  const common = { version: '1.0', provider_name: 'MoeGo', provider_url: `${SHARE_ORIGIN}/`, title: metadata.title, width, height };
  if (page.searchParams.get('unfurl') === 'oembed-rich') {
    return { ...common, type: 'rich', html: `<a href="${escapeHtml(page.href)}"><img src="${escapeHtml(imageUrl)}" width="${width}" height="${height}" alt="${escapeHtml(metadata.alt)}" /></a>` };
  }
  return { ...common, type: 'photo', url: imageUrl };
}
