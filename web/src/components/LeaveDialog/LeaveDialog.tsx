import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Dialog } from '../../ui/primitives/Dialog';

export interface LeaveDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  inline?: boolean;
}

/** 上传表单未提交时站内离开的确认：继续填写保留内容；放弃并离开清除本页内容后前往原目标。 */
export function LeaveDialog({ open, onStay, onLeave, inline }: LeaveDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      inline={inline}
      title={t('upload.leave_title')}
      onClose={onStay}
      actions={
        <>
          <Button block onClick={onStay} data-testid="keep-editing">
            {t('upload.keep_editing')}
          </Button>
          <Button block variant="secondary" onClick={onLeave} data-testid="discard-leave">
            {t('upload.discard_and_leave')}
          </Button>
        </>
      }
    />
  );
}
