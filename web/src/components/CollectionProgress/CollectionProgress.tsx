import { useI18n } from '../../i18n';
import styles from './CollectionProgress.module.css';

const MARK = '\u0000';

/** 图鉴完成度：只显示当前进度，已收集数高亮；首版不做收齐庆祝。 */
export function CollectionProgress({ collected, total }: { collected: number; total: number }) {
  const { t } = useI18n();
  const [before, after = ''] = t('collection.progress', { collected: MARK, total }).split(MARK);
  return (
    <p className={styles.progress} data-testid="collection-progress">
      {before}
      <span className={styles.count}>{collected}</span>
      {after}
    </p>
  );
}
