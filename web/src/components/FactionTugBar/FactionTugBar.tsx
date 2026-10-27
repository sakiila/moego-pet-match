import type { CSSProperties } from 'react';
import type { FactionLead, FactionSideView } from '../../api/types';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './FactionTugBar.module.css';

export interface FactionTugBarProps {
  sides: Record<'cat' | 'dog', Pick<FactionSideView, 'adjusted'>>;
  lead: FactionLead;
  /** 显示两端积分；迷雾期 adjusted 为 null 时自动只显示领先程度。 */
  showPoints?: boolean;
  compact?: boolean;
}

/** 迷雾期没有数字，按领先程度摆绳结：平局居中，小幅 56%，大幅 66%。 */
const FOG_SHARE = { even: 0.5, slight: 0.56, clear: 0.66 } as const;

/** 喵派在左、汪派在右，绳结落在双方调整后总分的占比处；分差很大时也给落后方留一截。 */
export function catShare(sides: FactionTugBarProps['sides'], lead: FactionLead): number {
  const { cat, dog } = { cat: sides.cat.adjusted, dog: sides.dog.adjusted };
  if (cat === null || dog === null) {
    const share = FOG_SHARE[lead.level];
    return lead.leader === 'dog' ? 1 - share : share;
  }
  if (cat + dog === 0) return 0.5;
  return Math.min(0.9, Math.max(0.1, cat / (cat + dog)));
}

export function FactionTugBar({ sides, lead, showPoints = true, compact = false }: FactionTugBarProps) {
  const { t, locale } = useI18n();
  const share = catShare(sides, lead);
  const fmt = (n: number | null) => (n === null ? '' : t('faction.points', { points: n.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') }));
  const levelText = lead.leader ? t(`faction.lead_${lead.level === 'clear' ? 'clear' : 'slight'}`, { team: t(`faction.${lead.leader}`) }) : t('faction.lead_even');
  return (
    <div className={styles.root} data-compact={compact || undefined} data-testid="faction-tug">
      <div className={styles.ends}>
        <span className={styles.side} data-faction="cat"><Icon name="faction-cat" size={compact ? 24 : 32} />{t('faction.cat')}</span>
        <span className={styles.side} data-faction="dog">{t('faction.dog')}<Icon name="faction-dog" size={compact ? 24 : 32} /></span>
      </div>
      <div className={styles.bar} role="img" aria-label={levelText} style={{ '--cat-share': `${(share * 100).toFixed(1)}%` } as CSSProperties}>
        <span className={styles.cat} />
        <span className={styles.knot} />
      </div>
      <div className={styles.ends}>
        {showPoints && sides.cat.adjusted !== null && sides.dog.adjusted !== null ? (
          <>
            <span className={styles.points}>{fmt(sides.cat.adjusted)}</span>
            <span className={styles.points}>{fmt(sides.dog.adjusted)}</span>
          </>
        ) : (
          <span className={styles.level}>{levelText}</span>
        )}
      </div>
    </div>
  );
}
