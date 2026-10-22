import styles from './StatusMessage.module.css';

export interface StatusMessageProps {
  text: string;
  tone?: 'info' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

/** 一行状态说明，可带一个操作（如重试）；用于未找到、读取失败、保存状态等。 */
export function StatusMessage({ text, tone = 'info', actionLabel, onAction }: StatusMessageProps) {
  return (
    <p className={`${styles.message} ${tone === 'error' ? styles.error : ''}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{text}</span>
      {actionLabel && onAction && (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </p>
  );
}
