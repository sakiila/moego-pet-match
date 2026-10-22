import { useI18n } from '../../i18n';
import styles from './BrandHeader.module.css';

/** 顶部：MoeGo 字标 + 中/EN 切换；切换只改界面文字，不影响本局。 */
export function BrandHeader({ tagline }: { tagline?: boolean }) {
  const { t, locale, setLocale } = useI18n();
  const [first, ...rest] = t('board.title').split(' ');
  return (
    <header>
      <div className={styles.bar}>
        <span className={styles.wordmark}>
          Moe<span>Go</span>
        </span>
        <span className={styles.lang}>
          <button type="button" aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>
            中
          </button>
          /
          <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>
            EN
          </button>
        </span>
      </div>
      <h1 className={styles.title}>
        {first} <em>{rest.join(' ')}</em>
      </h1>
      {tagline && <p className={styles.tagline}>{t('board.tagline')}</p>}
    </header>
  );
}
