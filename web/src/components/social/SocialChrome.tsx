import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { Icon } from '../../ui/primitives/Icon';
import { Button } from '../../ui/primitives/Button';
import logo from '../../ui/art/moego-logo.webp';
import styles from './Social.module.css';

export function SocialHeader({
  title,
  onBack,
  backHome = false,
  backLabel,
  children,
}: {
  title?: string;
  onBack: () => void;
  backHome?: boolean;
  backLabel?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <header className={styles.topbar}>
      <button
        className={styles.back}
        onClick={onBack}
        aria-label={backLabel ?? t(backHome ? 'action.back_to_shop' : 'social.back')}
      >
        {backLabel ? (
          <span>{backLabel}</span>
        ) : (
          <>
            <Icon name="back" size={19} />
            {backHome && <span className={styles.backText}>{t('action.back_to_shop')}</span>}
          </>
        )}
      </button>
      {title ? <h1>{title}</h1> : <img className={styles.logo} src={logo} alt="MoeGo" />}
      <div className={styles.utility}>{children}</div>
    </header>
  );
}
export function SocialLanguage() {
  const { locale, setLocale } = useI18n();
  return (
    <span className={styles.locale}>
      <button aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>
        中
      </button>
      /
      <button aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>
        EN
      </button>
    </span>
  );
}
export function SocialIdentity({ name, src, onOpen }: { name: string; src?: string; onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <button className={styles.iconButton} aria-label={t('social.my_posts')} onClick={onOpen}>
      <Avatar name={name} src={src} size={32} />
    </button>
  );
}
export type SocialLoadState = 'normal' | 'empty' | 'loading' | 'error';
export function SocialEmpty({
  title,
  body,
  onCreate,
  state = 'empty',
  onRetry,
  actionLabel,
  onAction,
}: {
  title?: string;
  body?: string;
  onCreate?: () => void;
  state?: SocialLoadState;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { t } = useI18n();
  if (state === 'loading')
    return (
      <div className={styles.skeleton} role="status" aria-label={t('social.loading')}>
        <span />
        <span className={styles.skeletonPhoto} />
        <span />
        <span className={styles.skeletonPhoto} />
      </div>
    );
  return (
    <section className={styles.empty} role={state === 'error' ? 'alert' : undefined}>
      <Icon name={state === 'error' ? 'retry' : 'social-feed'} size={state === 'error' ? 64 : 112} />
      <h2>{state === 'error' ? t('social.load_failed') : (title ?? t('social.empty_title'))}</h2>
      <p>{body ?? t('social.empty_body')}</p>
      {state === 'error' ? (
        <Button onClick={onRetry}>{t('social.retry')}</Button>
      ) : onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : (
        onCreate && (
          <Button iconName="social-create" onClick={onCreate}>
            {t('social.empty_action')}
          </Button>
        )
      )}
    </section>
  );
}
