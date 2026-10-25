import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** 0–1；null 表示进度未知（如处理照片、等待服务器保存），显示来回滑动的条。 */
  value: number | null;
  /** 无障碍名称。 */
  label: string;
}

/** 细条进度：灰色轨道上橙色填充，进度未知时滑动提示仍在进行。 */
export function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = value === null ? null : Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={styles.track} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
      <span className={styles.fill} data-indeterminate={pct === null} style={pct === null ? undefined : { width: `${pct}%` }} />
    </div>
  );
}
