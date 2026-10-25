import type { ShareCardState } from '../../game/useShareCard';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Sheet } from '../../ui/primitives/Sheet';
import styles from './ShareSheet.module.css';

export interface ShareSheetProps {
  open: boolean;
  /** 弹层标题；默认「成绩卡预览」。 */
  title?: string;
  state: ShareCardState;
  /** 浏览器支持分享图片文件时才显示「分享图片」。 */
  canShare: boolean;
  onSave: () => void;
  onShare: () => void;
  onRetry: () => void;
  onClose: () => void;
  inline?: boolean;
  /** 生成中的进度 0–1（贴纸册逐张加载贴纸）；不传只显示转圈。 */
  progress?: number;
  /** 长册页按完整图片比例预览，不压成成绩卡的 3:4。 */
  imageLayout?: 'card' | 'natural';
}

/** 分享图片预览（成绩卡、店长海报）：先生成预览，玩家主动保存或调用系统分享；不自动发送。 */
export function ShareSheet({ open, title, state, canShare, onSave, onShare, onRetry, onClose, inline, progress, imageLayout = 'card' }: ShareSheetProps) {
  const { t } = useI18n();
  const heading = title ?? t('share.preview');
  return (
    <Sheet open={open} inline={inline} label={heading} closeLabel={t('action.close')} onClose={onClose} badge={<h2 className={styles.title}>{heading}</h2>}>
      <div className={styles.body} data-testid="share-sheet" data-state={state.kind}>
        <div className={`${styles.preview} ${imageLayout === 'natural' ? styles.natural : ''}`}>
          {state.kind === 'ready' && <img src={state.url} alt={heading} data-testid="share-image" />}
          {state.kind === 'generating' && (
            <div className={styles.loading} role="status" aria-busy="true" data-testid="share-loading">
              <span className={styles.spinner} aria-hidden="true" />
              <span className={styles.loadingText}>{t('share.generating')}</span>
              {progress !== undefined && (
                <span className={styles.progress} aria-hidden="true">
                  <span className={styles.progressFill} style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }} />
                </span>
              )}
            </div>
          )}
          {state.kind === 'failed' && <p className={styles.failed}>{t('share.failed')}</p>}
        </div>
        {state.kind === 'failed' ? (
          <Button size="lg" variant="secondary" block iconName="retry" onClick={onRetry}>
            {t('action.retry')}
          </Button>
        ) : (
          <div className={styles.actions} data-share={canShare}>
            <Button size="lg" block iconName="save-image-white" onClick={onSave} disabled={state.kind !== 'ready'} data-testid="share-save">
              {t('share.save')}
            </Button>
            {canShare && (
              <Button size="lg" variant="secondary" block iconName="share-image" onClick={onShare} data-testid="share-send">
                {t('share.send')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
