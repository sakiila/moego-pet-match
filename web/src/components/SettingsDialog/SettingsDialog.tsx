import type { SoundPreferences } from '../../game/preferences';
import { useFeedback } from '../../audio/FeedbackProvider';
import { useI18n, type MessageKey } from '../../i18n';
import { Sheet } from '../../ui/primitives/Sheet';
import { Icon, type IconName } from '../../ui/primitives/Icon';
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

const ICON: Record<'language' | keyof SoundPreferences, IconName> = {
  language: 'language',
  music: 'music',
  sfx: 'sound-effects',
  haptics: 'haptics',
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
        <span className={`${styles.icon} ${disabled ? styles.dimmed : ''}`}>
          <Icon name={ICON[key]} size={32} />
        </span>
        {t(label)}
      </span>
      <Toggle checked={prefs[key]} onChange={(on) => set(key, on)} label={t(label)} onText={t('settings.on')} offText={t('settings.off')} disabled={disabled} />
    </div>
  );

  const title = (
    <h2 className={styles.title}>
      <Icon name="settings" size={30} />
      {t('nav.settings')}
    </h2>
  );

  return (
    <Sheet open={open} inline={inline} label={t('nav.settings')} closeLabel={t('action.close')} onClose={onClose} badge={title}>
      <div className={styles.body} data-testid="settings" data-variant={variant}>
        {variant === 'shop' && (
          <div className={styles.language}>
            <span className={styles.label}>
              <span className={styles.icon}>
                <Icon name={ICON.language} size={32} />
              </span>
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
