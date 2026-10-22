import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Dialog } from '../../ui/primitives/Dialog';
import styles from './SettingsDialog.module.css';

/** 棋盘轻量设置：打开时计时继续。音乐、音效与轻震开关在声音接入时补上。 */
export function SettingsDialog({ open, onClose, inline }: { open: boolean; onClose: () => void; inline?: boolean }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <Dialog
      open={open}
      inline={inline}
      title={t('nav.settings')}
      onClose={onClose}
      actions={
        <Button block variant="secondary" onClick={onClose}>
          {t('action.close')}
        </Button>
      }
    >
      <div className={styles.row}>
        <span>{t('settings.language')}</span>
        <span className={styles.segmented}>
          <button type="button" aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>
            {t('settings.chinese')}
          </button>
          <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>
            {t('settings.english')}
          </button>
        </span>
      </div>
    </Dialog>
  );
}
