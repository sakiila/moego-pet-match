import type { CSSProperties } from 'react';
import { petDisplayName, petImage, type PetInfo } from '../../game/pets';
import { useI18n, type MessageKey } from '../../i18n';
import styles from './ScoreCard.module.css';

export interface ScoreCardProps {
  mode: 'normal' | 'fish';
  score: number;
  /** 保存状态的简短标记；完整说明由 SaveStatus 承接。 */
  saveState: 'saving' | 'saved' | 'failed';
  /** 只有服务端确认严格刷新个人最好时才为 true。 */
  newRecord: boolean;
  mvp: { pet: PetInfo; kind: number } | null;
  review: MessageKey;
  title: MessageKey;
  stats: { tiles: number; chain: number; tools: number };
  /** 零服务时由今日店长承接鼓励评语（普通局）；不编造 MVP。 */
  host?: { name: string; stickerSrc: string } | null;
}

const CONFETTI = ['#f96b1c', '#f7b733', '#4a8fe0', '#e5533d', '#2f9e6b'];

/**
 * 报告首屏：分数立即显示；MVP 与称号短促出现；新纪录只在已保存且严格刷新时显示标记与少量彩纸。
 * 零服务省略 MVP，由鼓励评语承接。所有内容来自冻结结果。
 */
export function ScoreCard({ mode, score, saveState, newRecord, mvp, review, title, stats, host }: ScoreCardProps) {
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
  const mvpLabel = mvp
    ? mode === 'fish'
      ? t('fish.report_mvp', { fishColorName: petDisplayName(mvp.pet, locale) })
      : t('report.mvp', { petName: mvp.pet.name })
    : null;
  return (
    <section className={styles.card} data-testid="score-card">
      <div className={styles.top}>
        <div>
          <span className={styles.scoreLabel}>{t('report.final_score')}</span>
          <span className={styles.score} data-testid="report-score">
            {fmt(score)}
          </span>
          {newRecord && <span className={styles.record}>{t('report.personal_best')}</span>}
        </div>
        <span className={styles.saveBadge} data-state={saveState}>
          {saveState === 'saved' ? `✓ ${t('report.saved')}` : saveState === 'saving' ? t('report.saving') : ''}
        </span>
      </div>
      {newRecord && (
        <span className={styles.confetti} aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  '--c': CONFETTI[i % CONFETTI.length],
                  '--dx': `${Math.cos(i) * 70}px`,
                  '--dy': `${Math.sin(i * 1.7) * 50 + 30}px`,
                  '--rot': `${i * 37}deg`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      )}
      {mvp ? (
        <div className={styles.mvp} data-testid="mvp">
          <div className={styles.sticker} style={{ '--tint': `var(--pet-tint-${mvp.kind % 6})` } as CSSProperties}>
            {petImage(mvp.pet, 512) ? <img src={petImage(mvp.pet, 512)!} alt={mvp.pet.name} /> : null}
          </div>
          <span className={styles.mvpName}>{mvpLabel}</span>
          <p className={styles.review}>“{t(review)}”</p>
        </div>
      ) : host ? (
        <div className={styles.mvp} data-testid="manager-host">
          <div className={styles.sticker} style={{ '--tint': 'var(--color-surface-muted)' } as CSSProperties}>
            <img src={host.stickerSrc} alt={host.name} />
          </div>
          <span className={styles.mvpName}>
            {t('home.manager')} · {host.name}
          </span>
          <p className={styles.review}>“{t(review)}”</p>
        </div>
      ) : (
        <p className={styles.noMvp}>{t(review)}</p>
      )}
      <span className={styles.stamp} data-testid="title-stamp">
        {t(title)}
      </span>
      <dl className={styles.stats}>
        <div>
          <dt>{t(mode === 'fish' ? 'fish.report_tiles' : 'report.service_tiles')}</dt>
          <dd>{fmt(stats.tiles)}</dd>
        </div>
        <div>
          <dt>{t('report.highest_chain')}</dt>
          <dd>{fmt(stats.chain)}</dd>
        </div>
        <div>
          <dt>{t('report.tools_used')}</dt>
          <dd>{fmt(stats.tools)}</dd>
        </div>
      </dl>
    </section>
  );
}
