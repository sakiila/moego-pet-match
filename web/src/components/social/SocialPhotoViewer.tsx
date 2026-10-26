import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n';
import type { SocialPost } from '../../social/model';
import { socialDate } from '../../social/dates';
import { Icon } from '../../ui/primitives/Icon';
import { useSocialModal } from './useSocialModal';
import styles from './Social.module.css';

export function SocialPhotoViewer({
  post,
  initialIndex,
  onClose,
}: {
  post: SocialPost;
  initialIndex: number;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const [index, setIndex] = useState(Math.min(initialIndex, post.photos.length - 1));
  const ref = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  useSocialModal(ref, onClose);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(post.photos.length - 1, i + 1));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [post.photos.length]);
  const photo = post.photos[index];
  if (!photo) return null;
  const extension = photo.src.startsWith('/img/social/')
    ? '.webp'
    : photo.src.startsWith('data:image/jpeg')
      ? '.jpg'
      : (photo.src.match(/\.(webp|png|jpe?g)(?:[?#]|$)/i)?.[0].replace(/[?#].*$/, '') ?? '');
  return createPortal(
    <div
      ref={ref}
      className={styles.viewer}
      role="dialog"
      aria-modal="true"
      aria-label={t('social.view_photo', { index: index + 1, count: post.photos.length })}
    >
      <div className={styles.topbar}>
        <button className={styles.iconButton} onClick={onClose} aria-label={t('social.close')}>
          <Icon name="close" size={23} className={styles.viewerControlIcon} />
        </button>
        <span aria-live="polite">{t('social.photo_count', { index: index + 1, count: post.photos.length })}</span>
        <a
          className={styles.iconButton}
          href={photo.src}
          download={`pet-moment-${index + 1}${extension}`}
          aria-label={t('social.download')}
        >
          <Icon name="save-image-white" size={23} />
        </a>
      </div>
      <img
        className={styles.viewerImage}
        src={photo.src}
        alt={photo.alt}
        onTouchStart={(e) => {
          touch.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touch.current) - touch.current;
          if (Math.abs(dx) > 40) setIndex((i) => Math.max(0, Math.min(post.photos.length - 1, i + (dx < 0 ? 1 : -1))));
          touch.current = null;
        }}
      />
      <div className={styles.viewerFooter}>
        <p className={styles.viewerMeta}>
          {post.author.name} · {socialDate(post.createdAt, locale, t('social.today'), t('social.yesterday'))}
        </p>
        <div className={styles.viewerControls}>
          <button className={styles.textButton} disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            {t('social.previous_photo')}
          </button>
          <button
            className={styles.textButton}
            disabled={index === post.photos.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            {t('social.next_photo')}
          </button>
        </div>
        <div className={styles.viewerThumbs}>
          {post.photos.map((p, i) => (
            <button
              key={p.id}
              aria-pressed={i === index}
              aria-label={t('social.view_photo', { index: i + 1, count: post.photos.length })}
              onClick={() => setIndex(i)}
            >
              <img src={p.src} alt="" />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
