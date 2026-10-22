import { useI18n } from '../../i18n';
import styles from './ReportSummary.module.css';

export interface ReportSummaryProps {
  score: number;
  clearedCells: number;
  maxChain: number;
  toolsFired: number;
}

/** 阶段 1 基础报告：只展示本地事实数据，不显示已保存、已上榜或线上进度。 */
export function ReportSummary({ score, clearedCells, maxChain, toolsFired }: ReportSummaryProps) {
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
  return (
    <article className={styles.card} data-testid="report">
      <p className={styles.kicker}>{t('report.title')}</p>
      <h1 className={styles.title}>{t('round.finished')}</h1>
      <p className={styles.caption}>{t('report.generic_caption')}</p>
      <div className={styles.score}>
        <span className={styles.scoreLabel}>{t('report.final_score')}</span>
        <span className={styles.scoreValue} data-testid="report-score">
          {fmt(score)}
        </span>
      </div>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>{t('report.service_tiles')}</dt>
          <dd>{fmt(clearedCells)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>{t('report.highest_chain')}</dt>
          <dd>{fmt(maxChain)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>{t('report.tools_used')}</dt>
          <dd>{fmt(toolsFired)}</dd>
        </div>
      </dl>
    </article>
  );
}
