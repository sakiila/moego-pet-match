import { Icon, type IconName } from '../../ui/primitives/Icon';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon: IconName;
  text: string;
  /** row：图标在左、文字在右（零收集提示，下方仍列出未收集）；stack：图标在上（搜索无结果）。 */
  layout?: 'row' | 'stack';
}

/** 空状态插图＋说明（collection-marks-original-v1）：零收集用空白图鉴册，搜索无结果用索引卡与放大镜。 */
export function EmptyState({ icon, text, layout = 'stack' }: EmptyStateProps) {
  return (
    <div className={styles.empty} data-layout={layout} role="status">
      <Icon name={icon} size={layout === 'row' ? 64 : 96} />
      <p className={styles.text}>{text}</p>
    </div>
  );
}
