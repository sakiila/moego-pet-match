import type { Locale } from '../i18n';
export function socialDate(iso: string, locale: Locale, today: string, yesterday: string, now = new Date()): string {
  const date = new Date(iso);
  const key = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(d);
  const time = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(date);
  if (key(date) === key(now)) return `${today} ${time}`;
  if (key(date) === key(new Date(now.getTime() - 86_400_000))) return `${yesterday} ${time}`;
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}
