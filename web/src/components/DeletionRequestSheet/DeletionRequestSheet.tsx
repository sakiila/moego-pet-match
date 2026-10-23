import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Sheet } from '../../ui/primitives/Sheet';
import { TextArea } from '../../ui/primitives/TextArea';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import styles from './DeletionRequestSheet.module.css';

export const DELETION_NOTE_MAX = 1000;

export interface DeletionRequestSheetProps {
  open: boolean;
  /** 自动关联的宠物；null 为不针对某只宠物的一般申请。 */
  pet: { name: string; stickerSrc: string; ownerName: string } | null;
  onSubmit: (note: string) => Promise<unknown>;
  onClose: () => void;
  inline?: boolean;
}

/** 资料删除申请：提交只表示收到，由 Bob 人工核实处理，不立即隐藏或删除；失败保留补充说明可重试。 */
export function DeletionRequestSheet({ open, pet, onSubmit, onClose, inline }: DeletionRequestSheetProps) {
  const { t } = useI18n();
  const [note, setNote] = useState('');
  const [state, setState] = useState<'editing' | 'submitting' | 'received' | 'failed'>('editing');
  useEffect(() => {
    if (open) {
      setNote('');
      setState('editing');
    }
  }, [open]);

  const title = t(pet ? 'delete.title' : 'info.removal_link');
  const submit = async () => {
    setState('submitting');
    try {
      await onSubmit(note.trim());
      setState('received');
    } catch {
      setState('failed');
    }
  };

  return (
    <Sheet open={open} inline={inline} label={title} closeLabel={t('action.close')} onClose={onClose} badge={<h2 className={styles.title}>{title}</h2>}>
      <div className={styles.body} data-testid="deletion-sheet" data-state={state}>
        {pet && (
          <div className={styles.pet}>
            <img src={pet.stickerSrc} alt="" />
            <div>
              <p className={styles.name}>{pet.name}</p>
              <p className={styles.owner}>
                {t('pet.owner')}：{pet.ownerName}
              </p>
            </div>
          </div>
        )}
        {state === 'received' ? (
          <>
            <StatusMessage text={t('delete.received')} />
            <Button size="lg" block variant="secondary" onClick={onClose}>
              {t('action.close')}
            </Button>
          </>
        ) : (
          <>
            <p className={styles.hint}>{t('delete.hint')}</p>
            <TextArea
              label={t('delete.note')}
              placeholder={t('delete.note_hint')}
              value={note}
              onChange={setNote}
              maxLength={DELETION_NOTE_MAX}
              disabled={state === 'submitting'}
              data-testid="deletion-note"
            />
            {state === 'failed' && <StatusMessage tone="error" text={t('delete.failed')} />}
            <Button size="lg" block onClick={submit} disabled={state === 'submitting'} aria-busy={state === 'submitting'} data-testid="deletion-submit">
              {t('delete.submit')}
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
