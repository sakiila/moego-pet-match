import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import { Button } from '../../ui/primitives/Button';
import { BrandHeader } from '../BrandHeader/BrandHeader';
import { PlayerMenu } from '../PlayerMenu/PlayerMenu';
import type { SocialPerson } from '../../social/model';
import styles from './Social.module.css';

export interface SocialHeaderProps {
  title: string;
  /** 回游戏首页（品牌栏「回门店」）。 */
  onHome: () => void;
  /** 子页的来路返回；根页不传，标题左对齐。 */
  back?: { label: string; onClick: () => void };
  /** 品牌栏右侧的身份头像，点开下拉：我的动态、我的称号、收工。 */
  identity?: SocialIdentityProps;
  /** 页面导航栏右侧的当前页主操作。 */
  children?: ReactNode;
}
/** 动态墙页头：上层沿用门店品牌栏（MoeGo / 回门店 / 语言 / 头像），下层是返回来路、标题与主操作。 */
export function SocialHeader({ title, onHome, back, identity, children }: SocialHeaderProps) {
  const { t } = useI18n();
  return (
    <header className={styles.header}>
      <BrandHeader
        barOnly
        onBack={onHome}
        backLabel={t('social.back_shop')}
        trailing={identity && <SocialIdentity {...identity} />}
      />
      <div className={back ? styles.pageNav : styles.rootNav}>
        {back && (
          <button type="button" className={styles.back} onClick={back.onClick}>
            <Icon name="back" size={18} />
            <span className={styles.backText}>{back.label}</span>
          </button>
        )}
        <h1>{title}</h1>
        <div className={styles.utility}>{children}</div>
      </div>
    </header>
  );
}
export interface SocialIdentityProps {
  person: SocialPerson;
  onMine: () => void;
  onTitles?: () => void;
  /** 不传时（开发预览）菜单不提供收工。 */
  onClockOut?: () => void;
}
export function SocialIdentity({ person, onMine, onTitles, onClockOut }: SocialIdentityProps) {
  const { t } = useI18n();
  return (
    <PlayerMenu
      name={person.name}
      userId={person.id}
      avatarSrc={person.avatarSrc}
      equippedTitle={person.title}
      actions={[{ icon: 'paw-print', label: t('social.my_posts'), onClick: onMine }]}
      onTitles={onTitles}
      onClockOut={onClockOut}
    />
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
