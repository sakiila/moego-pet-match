import type { ReactNode } from 'react';
import type { SoundPreferences } from '../../game/preferences';
import { useFeedback } from '../../audio/FeedbackProvider';
import { useI18n, type MessageKey } from '../../i18n';
import { Sheet } from '../../ui/primitives/Sheet';
import { Toggle } from '../../ui/primitives/Toggle';
import styles from './SettingsDialog.module.css';

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  /** shop：门店（语言 + 声音触感）；board：棋盘轻量设置，只有三个声音触感开关，打开时计时继续。 */
  variant?: 'shop' | 'board';
  inline?: boolean;
  /** 陈列页用：固定显示的偏好与轻震可用性。 */
  preview?: { prefs: SoundPreferences; hapticsAvailable: boolean };
}

const ICON: Record<'language' | keyof SoundPreferences, ReactNode> = {
  language: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="6.5" cy="18" r="2.5" fill="var(--color-brand)" />
      <circle cx="17.5" cy="16" r="2.5" fill="var(--color-brand)" />
    </svg>
  ),
  sfx: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="var(--color-brand)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  haptics: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="7" y="3" width="10" height="18" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M3.5 8v8M20.5 8v8" stroke="var(--color-brand)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * 设置（对照 mobile-settings-v1）：语言与背景音乐、消除音效、轻震三个开关，各自记住选择。
 * 音乐与音效首次关闭，支持震动的设备轻震首次开启；不支持时轻震不可用并说明，照常可玩。
 */
export function SettingsDialog({ open, onClose, variant = 'shop', inline, preview }: SettingsDialogProps) {
  const { t, locale, setLocale } = useI18n();
  const live = useFeedback();
  const prefs = preview?.prefs ?? live.prefs;
  const hapticsAvailable = preview?.hapticsAvailable ?? live.hapticsAvailable;
  const set = preview ? () => {} : live.setPref;

  const row = (key: keyof SoundPreferences, label: MessageKey, disabled = false) => (
    <div className={styles.row} key={key}>
      <span className={styles.label}>
        <span className={styles.icon}>{ICON[key]}</span>
        {t(label)}
      </span>
      <Toggle checked={prefs[key]} onChange={(on) => set(key, on)} label={t(label)} onText={t('settings.on')} offText={t('settings.off')} disabled={disabled} />
    </div>
  );

  const title = (
    <h2 className={styles.title}>
      <svg viewBox="0 0 24 24" aria-hidden className={styles.gear}>
        <g fill="currentColor">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect key={deg} x="10.2" y="1.5" width="3.6" height="5" rx="1.2" transform={`rotate(${deg} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="7.2" />
        </g>
        <circle cx="12" cy="12" r="3" fill="var(--color-paper)" />
      </svg>
      {t('nav.settings')}
    </h2>
  );

  return (
    <Sheet open={open} inline={inline} label={t('nav.settings')} closeLabel={t('action.close')} onClose={onClose} badge={title}>
      <div className={styles.body} data-testid="settings" data-variant={variant}>
        {variant === 'shop' && (
          <div className={styles.language}>
            <span className={styles.label}>
              <span className={styles.icon}>{ICON.language}</span>
              {t('settings.language')}
            </span>
            <span className={styles.segmented}>
              <button type="button" aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>
                {t('settings.chinese')}
              </button>
              <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>
                {t('settings.english')}
              </button>
            </span>
          </div>
        )}
        {row('music', 'settings.music')}
        {row('sfx', 'settings.sfx')}
        {row('haptics', 'settings.haptics', !hapticsAvailable)}
        {!hapticsAvailable && <p className={styles.note}>{t('settings.haptics_unavailable')}</p>}
        <p className={styles.hint}>{t('settings.preference_hint')}</p>
      </div>
    </Sheet>
  );
}
