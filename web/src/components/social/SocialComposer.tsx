import { useRef } from 'react';
import { useI18n } from '../../i18n';
import { MAX_PHOTOS, MAX_POST_LENGTH, type SocialPerson, type SocialPhoto, type SocialPet } from '../../social/model';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';
import { Icon } from '../../ui/primitives/Icon';
import styles from './Social.module.css';

export interface SocialComposerProps {
  author: SocialPerson;
  body: string;
  photos: SocialPhoto[];
  pets: SocialPet[];
  petId: string;
  processing: boolean;
  publishing: boolean;
  error?: string;
  onBody: (value: string) => void;
  onPet: (value: string) => void;
  onFiles: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
}
/** 发布页正文；页头的取消 / 发布由页面编排提供。 */
export function SocialComposer(props: SocialComposerProps) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const busy = props.processing || props.publishing;
  return (
    <>
      <div className={styles.authorRow}>
        <AchievementAvatar name={props.author.name} src={props.author.avatarSrc} seed={props.author.id} equippedTitle={props.author.title} />
        <div>
          <strong className={styles.name}>{props.author.name}</strong>
          <span className={styles.meta}>{t('social.colleagues_only')}</span>
        </div>
      </div>
      <textarea
        className={styles.editor}
        value={props.body}
        onChange={(e) => props.onBody(e.target.value)}
        maxLength={MAX_POST_LENGTH}
        disabled={props.publishing}
        placeholder={t('social.post_placeholder')}
        aria-label={t('social.post_placeholder')}
      />
      <span className={styles.meta}>{t('social.chars', { count: props.body.length, max: MAX_POST_LENGTH })}</span>
      <div className={styles.photoGrid}>
        {props.photos.map((photo, i) => (
          <div key={photo.id} className={styles.photoTile}>
            <img src={photo.src} alt={photo.alt} />
            <button
              className={styles.remove}
              disabled={busy}
              onClick={() => props.onRemovePhoto(photo.id)}
              aria-label={t('social.remove_photo', { index: i + 1 })}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
        {props.photos.length < MAX_PHOTOS && (
          <div className={styles.photoTile}>
            <button className={styles.addPhoto} disabled={busy} onClick={() => input.current?.click()}>
              <Icon name="choose-photo" size={32} />
              {t(props.processing ? 'social.photo_busy' : 'social.add_photos')}
            </button>
          </div>
        )}
      </div>
      <input
        ref={input}
        type="file"
        className={styles.hiddenInput}
        accept="image/jpeg,image/png,image/webp"
        multiple
        aria-label={t('social.add_photos')}
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = '';
          props.onFiles(files);
        }}
      />
      <p className={styles.meta}>{t('social.photos_count', { count: props.photos.length, max: MAX_PHOTOS })}</p>
      {props.error && (
        <p className={styles.danger} role="alert">
          {props.error}
        </p>
      )}
      {!!props.pets.length && (
        <div className={styles.petSelect}>
          <Icon name="my-pets" size={38} />
          <label>
            {t('social.link_pet')}
            <select value={props.petId} onChange={(e) => props.onPet(e.target.value)} disabled={busy}>
              <option value="">{t('social.no_pet')}</option>
              {props.pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className={`${styles.hint} ${styles.tipCard}`}>
        <Icon name="social-tip" size={32} />
        <div>
          <p>{t('social.photos_only')}</p>
          <p className={styles.meta}>{t('social.publish_hint')}</p>
        </div>
      </div>
    </>
  );
}
