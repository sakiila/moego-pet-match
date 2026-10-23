import type { MessageKey } from '../../i18n';
import { useI18n } from '../../i18n';
import { RichText } from '../../ui/primitives/RichText';
import { Sheet } from '../../ui/primitives/Sheet';
import styles from './UseInfoSheet.module.css';

export interface UseInfoSheetProps {
  open: boolean;
  title: MessageKey;
  body: MessageKey;
  onClose: () => void;
  inline?: boolean;
}

/** 在当前页展开的说明弹层（照片展示与处理说明等）；关闭后页面内容原样保留。 */
export function UseInfoSheet({ open, title, body, onClose, inline }: UseInfoSheetProps) {
  const { t } = useI18n();
  return (
    <Sheet open={open} inline={inline} label={t(title)} closeLabel={t('action.close')} onClose={onClose} badge={<h2 className={styles.title}>{t(title)}</h2>}>
      <RichText className={styles.body} text={t(body)} />
    </Sheet>
  );
}
