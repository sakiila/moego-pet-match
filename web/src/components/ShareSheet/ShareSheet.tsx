import type { ShareCardState } from '../../game/useShareCard';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Sheet } from '../../ui/primitives/Sheet';
import styles from './ShareSheet.module.css';

export interface ShareSheetProps {
  open: boolean;
  state: ShareCardState;
  /** 浏览器支持分享图片文件时才显示「分享图片」。 */
  canShare: boolean;
  onSave: () => void;
  onShare: () => void;
  onRetry: () => void;
  onClose: () => void;
  inline?: boolean;
}

/** 成绩卡预览：先生成预览，玩家主动保存或调用系统分享；不自动发送。 */
export function ShareSheet({ open, state, canShare, onSave, onShare, onRetry, onClose, inline }: ShareSheetProps) {
  const { t } = useI18n();
  return (
    <Sheet open={open} inline={inline} label={t('share.preview')} closeLabel={t('action.close')} onClose={onClose} badge={<h2 className={styles.title}>{t('share.preview')}</h2>}>
      <div className={styles.body} data-testid="share-sheet" data-state={state.kind}>
        <div className={styles.preview}>
          {state.kind === 'ready' && <img src={state.url} alt={t('share.preview')} data-testid="share-image" />}
          {state.kind === 'generating' && <span className={styles.loading} aria-busy="true" />}
          {state.kind === 'failed' && <p className={styles.failed}>{t('share.failed')}</p>}
        </div>
        {state.kind === 'failed' ? (
          <Button size="lg" block onClick={onRetry}>
            {t('action.retry')}
          </Button>
        ) : (
          <div className={styles.actions} data-share={canShare}>
            <Button size="lg" block onClick={onSave} disabled={state.kind !== 'ready'} data-testid="share-save">
              {t('share.save')}
            </Button>
            {canShare && (
              <Button size="lg" variant="secondary" block onClick={onShare} data-testid="share-send">
                {t('share.send')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
