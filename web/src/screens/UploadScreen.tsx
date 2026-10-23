import { useState } from 'react';
import { UploadError, api, type UploadErrorKind } from '../api/client';
import type { PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { LeaveDialog } from '../components/LeaveDialog/LeaveDialog';
import { OwnerRow } from '../components/OwnerRow/OwnerRow';
import { PhotoPicker } from '../components/PhotoPicker/PhotoPicker';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { UploadReceived } from '../components/UploadReceived/UploadReceived';
import { UseInfoSheet } from '../components/UseInfoSheet/UseInfoSheet';
import { avatarUrl } from '../game/pets';
import { useI18n, type MessageKey } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { TextField } from '../ui/primitives/TextField';
import styles from './Screen.module.css';

export const UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
const PET_NAME_MAX = 40;

const ERROR_TEXT: Record<UploadErrorKind, MessageKey> = {
  too_large: 'upload.too_large',
  invalid_photo: 'upload.invalid_photo',
  daily_limit: 'upload.daily_limit',
  name_required: 'upload.name_required',
  failed: 'upload.failed',
};

export interface UploadScreenProps {
  player: PlayerView;
  onHome: () => void;
  onPlay: () => void;
  /** 陈列页用：替换提交。 */
  submit?: (playerId: string, petName: string, photo: File) => Promise<unknown>;
}

/**
 * 添加我家毛孩子：选一张原图 → 预览 → 填名字、看主人与展示说明 → 提交。主人固定为当前身份。
 * 失败保留填写内容；有未提交内容时站内离开先确认。成功只表示已收到，后续人工处理上架。
 */
export function UploadScreen({ player, onHome, onPlay, submit = api.submitPet }: UploadScreenProps) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [photoError, setPhotoError] = useState<MessageKey | null>(null);
  const [nameError, setNameError] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [received, setReceived] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [leaving, setLeaving] = useState<(() => void) | null>(null);

  const dirty = !received && (!!file || name.trim().length > 0);
  const leave = (go: () => void) => (dirty ? setLeaving(() => go) : go());

  const choose = (f: File) => {
    setFile(f);
    setError(null);
    setPhotoError(f.size > UPLOAD_MAX_BYTES ? 'upload.too_large' : null);
  };

  const onSubmit = async () => {
    const trimmed = name.trim();
    const missingPhoto = !file;
    setPhotoError(missingPhoto ? 'upload.photo_required' : file!.size > UPLOAD_MAX_BYTES ? 'upload.too_large' : null);
    setNameError(!trimmed);
    if (missingPhoto || !trimmed || file!.size > UPLOAD_MAX_BYTES) return;
    setSubmitting(true);
    setError(null);
    try {
      await submit(player.userId, trimmed, file!);
      setReceived(trimmed);
    } catch (e) {
      const kind: UploadErrorKind = e instanceof UploadError ? e.kind : 'failed';
      if (kind === 'too_large' || kind === 'invalid_photo') setPhotoError(ERROR_TEXT[kind]);
      else if (kind === 'name_required') setNameError(true);
      else setError(ERROR_TEXT[kind]);
    } finally {
      setSubmitting(false);
    }
  };

  if (received) {
    return (
      <main className={styles.screen}>
        <BrandHeader heading={t('upload.title')} onBack={onHome} />
        <UploadReceived petName={received} onPlay={onPlay} onHome={onHome} />
      </main>
    );
  }

  return (
    <main className={`${styles.screen} ${styles.withStickyActions}`}>
      <BrandHeader heading={t('upload.title')} onBack={() => leave(onHome)} />
      {file && <p className={styles.muted}>{t('upload.photo_hint')}</p>}
      <PhotoPicker file={file} onChange={choose} error={photoError ? t(photoError) : null} disabled={submitting} />
      <TextField
        label={t('upload.pet_name')}
        placeholder={t('upload.pet_name_placeholder')}
        value={name}
        onChange={(v) => {
          setName(v);
          if (v.trim()) setNameError(false);
        }}
        maxLength={PET_NAME_MAX}
        disabled={submitting}
        error={nameError ? t('upload.name_required') : null}
        data-testid="pet-name"
      />
      <OwnerRow name={player.name} userId={player.userId} avatarSrc={avatarUrl(player.userId)} />
      <div className={styles.summary}>
        <p className={styles.muted}>{t('upload.display_summary')}</p>
        <button type="button" className={styles.link} onClick={() => setInfoOpen(true)} data-testid="use-info">
          {t('upload.use_info')}
        </button>
      </div>
      {error && <StatusMessage tone="error" text={t(error)} />}
      <div className={styles.stickyActions}>
        <Button size="lg" block onClick={onSubmit} disabled={submitting} aria-busy={submitting} data-testid="upload-submit">
          {submitting ? t('upload.submitting') : `🐾 ${t('upload.submit')}`}
        </Button>
      </div>
      <UseInfoSheet open={infoOpen} title="upload.use_title" body="upload.use_body" onClose={() => setInfoOpen(false)} />
      <LeaveDialog
        open={!!leaving}
        onStay={() => setLeaving(null)}
        onLeave={() => {
          const go = leaving;
          setLeaving(null);
          setFile(null);
          setName('');
          go?.();
        }}
      />
    </main>
  );
}
