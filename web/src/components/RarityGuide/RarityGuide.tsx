import { useId, type CSSProperties } from 'react';
import type { AchievementRarity } from '../../game/achievementRarity';
import { useI18n } from '../../i18n';
import { RarityTag } from '../RarityTag/RarityTag';
import styles from './RarityGuide.module.css';

export function RarityGuide({ rarities }: { rarities: readonly AchievementRarity[] }) {
  const { t, locale } = useI18n();
  const gradientId = useId();
  if (!rarities.length) return null;
  return <div className={styles.guide} data-testid="rarity-guide" data-locale={locale}>
    <p className={styles.caption}>{t('achievement.rarity_guide')}</p>
    <div className={styles.track}>
      <svg className={styles.rail} viewBox="0 0 358 66" preserveAspectRatio="none" aria-hidden focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--rarity-rail-color-1)" />
            <stop offset="0.15" stopColor="var(--rarity-rail-color-2)" />
            <stop offset="0.28" stopColor="var(--rarity-rail-color-3)" />
            <stop offset="0.4" stopColor="var(--rarity-rail-color-4)" />
            <stop offset="0.54" stopColor="var(--rarity-rail-color-5)" />
            <stop offset="0.63" stopColor="var(--rarity-rail-color-6)" />
            <stop offset="0.74" stopColor="var(--rarity-rail-color-7)" />
            <stop offset="0.85" stopColor="var(--rarity-rail-color-8)" />
            <stop offset="1" stopColor="var(--rarity-rail-color-9)" />
          </linearGradient>
        </defs>
        <path d="M2 33H356M350 27L356 33L350 39" stroke={`url(#${gradientId})`} vectorEffect="non-scaling-stroke" />
      </svg>
      <ol className={styles.scale}>
        {rarities.map((rarity, index) => <li key={rarity} className={styles.item} data-rarity={rarity} data-side={index % 2 === 0 ? 'above' : 'below'}
          style={{ '--rarity-position': `${((index + 0.5) / rarities.length) * 100}%` } as CSSProperties}>
          <span className={styles.stem} aria-hidden />
          <RarityTag rarity={rarity} className={styles.label} />
        </li>)}
      </ol>
    </div>
  </div>;
}
