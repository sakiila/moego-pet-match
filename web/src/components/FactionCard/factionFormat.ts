import type { Locale } from '../../i18n';

/** 活动日期（北京自然日）：中文「11 月 2 日」，英文「Nov 2」。 */
export function formatEventDay(date: string, locale: Locale): string {
  const [, month, day] = date.split('-').map(Number);
  if (locale === 'zh') return `${month} 月 ${day} 日`;
  return new Date(Date.UTC(2000, month - 1, day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export const formatPoints = (n: number, locale: Locale) => n.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
