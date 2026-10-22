import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Dialog } from '../../ui/primitives/Dialog';

export interface QuitDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  inline?: boolean;
}

/** 提前收工确认：确认期间计时继续；到时由调用方自动关闭并照常结算。 */
export function QuitDialog({ open, onConfirm, onCancel, inline }: QuitDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      inline={inline}
      title={t('quit.title')}
      onClose={onCancel}
      actions={
        <>
          <Button block onClick={onCancel}>
            {t('action.keep_playing')}
          </Button>
          <Button block variant="secondary" onClick={onConfirm} data-testid="quit-confirm">
            {t('quit.confirm')}
          </Button>
        </>
      }
    >
      {t('quit.body')}
    </Dialog>
  );
}
