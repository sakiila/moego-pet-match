import { useEffect, useRef, type CSSProperties } from 'react';
import { useFeedback } from '../../audio/FeedbackProvider';
import { petDisplayName, petImage, type PetInfo } from '../../game/pets';
import type { TitleKey } from '../../game/report';
import { useI18n, type MessageKey } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import type { SettleResponse } from '../../api/types';
import type { Standing } from '../../game/standing';
import { TitleStamp } from '../TitleStamp/TitleStamp';
import { TodayStanding } from '../TodayStanding/TodayStanding';
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
  title: TitleKey;
  stats: { tiles: number; chain: number; tools: number };
  /** 零服务时由今日店长承接鼓励评语（普通局）；不编造 MVP。 */
  host?: { name: string; stickerSrc: string } | null;
  /** 原 MVP 已下架：以通用 MoeGo 图案与「本局成绩」承接，不另选 MVP。 */
  mvpRemoved?: boolean;
  /** 已计入 score 的猜主人奖励；大于 0 时在分数下注明，分数轻弹一下。 */
  quizBonus?: number;
  /** 今日榜上的名次（保存成功后读取）；null 或未提供时不显示。 */
  standing?: Standing | null;
  /** 结算返回的连续开工天数；只在本局是今天第一次打卡时显示「打卡第 N 天」标签。 */
  streak?: SettleResponse['streak'] | null;
  /** 点今日名次标签打开今日榜。 */
  onStanding?: () => void;
}

const CONFETTI = ['#f96b1c', '#f7b733', '#4a8fe0', '#e5533d', '#2f9e6b'];

/**
 * 报告首屏：分数立即显示；MVP 与称号短促出现；新纪录只在已保存且严格刷新时显示标记与少量彩纸。
 * 零服务省略 MVP，由鼓励评语承接。所有内容来自冻结结果。
 */
/** 读 :root 上的毫秒令牌（--print-start / --print-ms），与 CSS 动画同一时间线。 */
const cssMs = (name: string) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

export function ScoreCard({ mode, score, saveState, newRecord, mvp, review, title, stats, host, mvpRemoved = false, quizBonus = 0, standing = null, streak = null, onStanding }: ScoreCardProps) {
  const { t, locale } = useI18n();
  // 声音与轻震跟着打印动画的节拍：纸送到位的瞬间「叮」，印章拍下的瞬间「咚」
  const feedback = useFeedback();
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  useEffect(() => {
    const start = cssMs('--print-start');
    const ms = cssMs('--print-ms');
    const landed = window.setTimeout(() => feedbackRef.current.onPrinted(), start + ms * 0.8);
    const stamped = window.setTimeout(() => feedbackRef.current.onStamp(), start + ms + 150 + 360);
    return () => {
      window.clearTimeout(landed);
      window.clearTimeout(stamped);
    };
  }, []);
  const fmt = (n: number) => n.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
  const mvpLabel = mvp
    ? mode === 'fish'
      ? t('fish.report_mvp', { fishColorName: petDisplayName(mvp.pet, locale) })
      : t('report.mvp', { petName: mvp.pet.name })
    : null;
  const stamp = (
    <span className={styles.stamp} data-testid="title-stamp">
      <TitleStamp title={title} width={84} />
    </span>
  );
  const showTags = newRecord || !!standing || !!streak?.firstToday;
  return (
    <div className={styles.printer} data-print>
      <span className={styles.slot} aria-hidden />
      <div className={styles.wrap}>
        <section className={styles.card} data-testid="score-card">
          <div className={styles.head}>
            <div className={styles.top}>
              <div>
                <span className={styles.scoreLabel}>{t('report.final_score')}</span>
                <span key={quizBonus} className={styles.score} data-bump={quizBonus > 0 || undefined} data-testid="report-score">
                  {fmt(score)}
                </span>
                {quizBonus > 0 && (
                  <span className={styles.bonus} data-testid="quiz-bonus">
                    {t('report.quiz_bonus', { points: fmt(quizBonus) })}
                  </span>
                )}
              </div>
              <span className={styles.saveBadge} data-state={saveState}>
                {saveState === 'saved' ? (
                  t('report.saved')
                ) : saveState === 'saving' ? (
                  t('report.saving')
                ) : (
                  ''
                )}
              </span>
            </div>
            {/* 状态标签一行：新纪录、今日名次、打卡，有几个显示几个（mobile-report-slim-v1） */}
            {showTags && (
              <div className={styles.tags}>
                {newRecord && (
                  <span className={styles.record}>
                    <Icon name="new-record-flag" size={22} />
                    {t('report.personal_best')}
                  </span>
                )}
                {standing && <TodayStanding standing={standing} onOpen={onStanding} />}
                {streak?.firstToday && (
                  <span className={styles.streakTag} data-testid="report-streak">
                    {t('report.streak_day', { days: streak.days })}
                  </span>
                )}
              </div>
            )}
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
          {mvp && mvpRemoved ? (
            <div className={styles.mvp} data-testid="mvp-removed">
              <div className={styles.sticker} style={{ '--tint': 'var(--color-brand-soft)' } as CSSProperties}>
                <Icon name="open-shop" size={96} className={styles.generic} />
                {stamp}
              </div>
              <div className={styles.side}>
                <span className={styles.mvpName}>{t('report.generic_title')}</span>
                <p className={styles.review}>“{t(review)}”</p>
              </div>
            </div>
          ) : mvp ? (
            <div className={styles.mvp} data-testid="mvp">
              <div className={styles.sticker} style={{ '--tint': `var(--pet-tint-${mvp.kind % 6})` } as CSSProperties}>
                {petImage(mvp.pet, 512) ? <img src={petImage(mvp.pet, 512)!} alt={mvp.pet.name} /> : null}
                {stamp}
              </div>
              <div className={styles.side}>
                <span className={styles.mvpName}>
                  <Icon name="mvp-medal" size={26} />
                  {mvpLabel}
                </span>
                <p className={styles.review}>“{t(review)}”</p>
              </div>
            </div>
          ) : host ? (
            <div className={styles.mvp} data-testid="manager-host">
              <div className={styles.sticker} style={{ '--tint': 'var(--color-surface-muted)' } as CSSProperties}>
                <img src={host.stickerSrc} alt={host.name} />
                {stamp}
              </div>
              <div className={styles.side}>
                <span className={styles.mvpName}>
                  {t('home.manager')} · {host.name}
                </span>
                <p className={styles.review}>“{t(review)}”</p>
              </div>
            </div>
          ) : (
            <div className={styles.noMvp}>
              {stamp}
              <p>{t(review)}</p>
            </div>
          )}
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
      </div>
    </div>
  );
}
