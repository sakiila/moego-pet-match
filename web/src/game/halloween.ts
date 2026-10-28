export interface HalloweenWindow {
  startsAt: number;
  endsAt: number;
}

const HAS_TIMEZONE = /(Z|[+-]\d{2}:\d{2})$/;

/** 活动配置必须带明确时区，且结束晚于开始；无效配置保持原主题。 */
export function parseHalloweenWindow(start?: string, end?: string): HalloweenWindow | null {
  if (!start || !end || !HAS_TIMEZONE.test(start) || !HAS_TIMEZONE.test(end)) return null;
  const startsAt = Date.parse(start);
  const endsAt = Date.parse(end);
  return Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt > startsAt
    ? { startsAt, endsAt }
    : null;
}

/** 用户调整首期：北京时间10/28开始，11/2零时结束。 */
export const DEFAULT_HALLOWEEN_WINDOW = parseHalloweenWindow(
  '2026-10-28T00:00:00+08:00',
  '2026-11-02T00:00:00+08:00',
)!;

/** 整对配置才可覆盖首期；部分或无效覆盖关闭主题，避免误用日期。 */
export function configuredHalloweenWindow(start?: string, end?: string): HalloweenWindow | null {
  return start === undefined && end === undefined ? DEFAULT_HALLOWEEN_WINDOW : parseHalloweenWindow(start, end);
}

export const HALLOWEEN_WINDOW = configuredHalloweenWindow(import.meta.env.VITE_HALLOWEEN_START, import.meta.env.VITE_HALLOWEEN_END);

const END_FORMATTERS = {
  zh: new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
  en: new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
};

/** 展示实际窗口的结束时间，避免排期变化后仍显示旧的活动时长。 */
export function halloweenEndLabel(locale: 'zh' | 'en', window: HalloweenWindow = HALLOWEEN_WINDOW ?? DEFAULT_HALLOWEEN_WINDOW): string {
  return END_FORMATTERS[locale].format(window.endsAt);
}

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
