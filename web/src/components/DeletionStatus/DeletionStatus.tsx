import type { DeletionStatus as Status } from '../../api/types';
import { useI18n } from '../../i18n';
import styles from './DeletionStatus.module.css';

/** 删除申请的简单结果：资料删除申请 · 待处理 / 已处理；不显示进度或「已删除」。 */
export function DeletionStatus({ status, label }: { status: Status; label?: string }) {
  const { t } = useI18n();
  return (
    <span className={styles.chip} data-status={status} data-testid="deletion-status">
      <span className={styles.part}>{label ?? t('info.removal_link')}</span>
      <span className={styles.part}>· {t(status === 'pending' ? 'delete.pending' : 'delete.processed')}</span>
    </span>
  );
}
