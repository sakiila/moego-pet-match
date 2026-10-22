import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { zh, type MessageKey } from './zh';

export type Locale = 'zh' | 'en';
export type { MessageKey };

const messages: Record<Locale, Record<MessageKey, string>> = { zh, en };
const STORAGE_KEY = 'pet-match.locale';

/** 手动选择优先；否则按浏览器偏好匹配 zh/en；都不匹配时用英文。 */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // 存储不可用时退回浏览器偏好
  }
  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language];
  for (const lang of preferred) {
    const base = lang.toLowerCase().split('-')[0];
    if (base === 'zh' || base === 'en') return base;
  }
  return 'en';
}

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const text = messages[locale][key];
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
}

interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 无法记住时本次会话仍生效
    }
  }, []);

  const value = useMemo<I18n>(
    () => ({ locale, setLocale, t: (key, vars) => translate(locale, key, vars) }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
