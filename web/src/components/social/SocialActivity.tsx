import { Fragment } from 'react';
import { useI18n } from '../../i18n';
import { socialDate } from '../../social/dates';
import type { SocialNotice, SocialPost } from '../../social/model';
import { Avatar } from '../../ui/primitives/Avatar';
import { Icon } from '../../ui/primitives/Icon';
import { SocialEmpty } from './SocialChrome';
import styles from './Social.module.css';

export function SocialActivity({
  notices,
  posts,
  onOpen,
}: {
  notices: SocialNotice[];
  posts: SocialPost[];
  onOpen: (notice: SocialNotice) => void;
}) {
  const { t, locale } = useI18n();
  if (!notices.length) return <SocialEmpty title={t('social.no_activity')} body={t('social.no_activity_body')} />;
  const days = notices.map((n) =>
    socialDate(n.createdAt, locale, t('social.today'), t('social.yesterday')).replace(/\s\d{2}:\d{2}$/, ''),
  );
  return (
    <>
      {notices.map((n, index) => {
        const post = posts.find((p) => p.id === n.postId && !p.hidden);
        const photo = post?.photos[0] ?? n.photo;
        return (
          <Fragment key={n.id}>
            {(index === 0 || days[index] !== days[index - 1]) && <h2 className={styles.sectionTitle}>{days[index]}</h2>}
            <button className={`${styles.notice} ${!n.read ? styles.noticeUnread : ''}`} onClick={() => onOpen(n)}>
              <Avatar name={n.actor.name} src={n.actor.avatarSrc} seed={n.actor.id} size={36} />
              <Icon
                name={n.kind === 'comment' ? 'social-comment' : n.kind === 'paw' ? 'open-shop' : `social-${n.kind}`}
                size={20}
              />
              <span className={styles.noticeContent}>
                <strong>{t(`social.notice_${n.kind}`, { name: n.actor.name })}</strong>
                {n.excerpt && <p>{n.excerpt}</p>}
                <span className={styles.meta}>
                  {socialDate(n.createdAt, locale, t('social.today'), t('social.yesterday'))}
                  {!n.read && ` · ${t('social.unread')}`}
                </span>
              </span>
              {photo && <img className={styles.noticeThumb} src={photo.src} alt="" />}
            </button>
          </Fragment>
        );
      })}
      <p className={styles.preview}>{t('social.activity_hint')}</p>
    </>
  );
}
