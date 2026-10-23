import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import styles from './PhotoPicker.module.css';

export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

export interface PhotoPickerProps {
  file: File | null;
  onChange: (file: File) => void;
  /** 选择照片相关的错误（未选、过大），显示在选择区下方。 */
  error?: string | null;
  disabled?: boolean;
}

/**
 * 选一张宠物原图并预览。原样提交，不压缩、不裁切；浏览器解码不了（如非 Safari 的 HEIC）时
 * 显示文件名占位，照常可提交。
 */
export function PhotoPicker({ file, onChange, error, disabled }: PhotoPickerProps) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [undecodable, setUndecodable] = useState(false);

  useEffect(() => {
    setUndecodable(false);
    if (!file) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const pick = () => input.current?.click();
  const hidden = (
    <input
      ref={input}
      type="file"
      accept={PHOTO_ACCEPT}
      hidden
      data-testid="photo-input"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onChange(f);
        e.target.value = '';
      }}
    />
  );

  if (!file) {
    return (
      <div className={styles.wrap}>
        {hidden}
        <button type="button" className={styles.empty} onClick={pick} disabled={disabled} data-invalid={!!error}>
          <svg viewBox="0 0 48 48" aria-hidden>
            <rect x="6" y="12" width="36" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="24" cy="26" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M17 12l3-5h8l3 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          </svg>
          <span className={styles.choose}>{t('upload.choose_photo')}</span>
          <span className={styles.hint}>{t('upload.photo_hint')}</span>
        </button>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {hidden}
      <div className={styles.head}>
        <h2 className={styles.title}>{t('upload.preview')}</h2>
        <button type="button" className={styles.change} onClick={pick} disabled={disabled} data-testid="change-photo">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 10a8 8 0 0 1 14-4l2 2M20 4v4h-4M20 14a8 8 0 0 1-14 4l-2-2M4 20v-4h4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('upload.change_photo')}
        </button>
      </div>
      <div className={styles.preview}>
        {url && !undecodable ? (
          <img src={url} alt={t('upload.preview')} onError={() => setUndecodable(true)} data-testid="photo-preview" />
        ) : (
          <p className={styles.placeholder} data-testid="photo-placeholder">
            {t('upload.preview_unavailable', { fileName: file.name })}
          </p>
        )}
      </div>
      <p className={styles.hint}>{t('upload.preview_hint')}</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
