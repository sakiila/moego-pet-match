export interface HalloweenWindow {
  startsAt: number;
  endsAt: number;
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const HAS_TIMEZONE = /(Z|[+-]\d{2}:\d{2})$/;

/** 活动配置必须带时区且恰好三天；未配置时保持原主题。 */
export function parseHalloweenWindow(start?: string, end?: string): HalloweenWindow | null {
  if (!start || !end || !HAS_TIMEZONE.test(start) || !HAS_TIMEZONE.test(end)) return null;
  const startsAt = Date.parse(start);
  const endsAt = Date.parse(end);
  return Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt - startsAt === THREE_DAYS_MS
    ? { startsAt, endsAt }
    : null;
}

export const HALLOWEEN_WINDOW = parseHalloweenWindow(
  import.meta.env.VITE_HALLOWEEN_START,
  import.meta.env.VITE_HALLOWEEN_END,
);

export function halloweenActive(now: number, window: HalloweenWindow | null = HALLOWEEN_WINDOW): boolean {
  return !!window && now >= window.startsAt && now < window.endsAt;
}

/** 只在开发环境提供强制预览；正式构建仅按活动窗口启用。 */
export function halloweenPreview(search: string, development: boolean): boolean | undefined {
  if (!development) return undefined;
  const theme = new URLSearchParams(search).get('theme');
  return theme === 'halloween' ? true : theme === 'default' ? false : undefined;
}

export function nextHalloweenBoundary(now: number, window: HalloweenWindow | null = HALLOWEEN_WINDOW): number | null {
  if (!window || now >= window.endsAt) return null;
  return now < window.startsAt ? window.startsAt : window.endsAt;
}
