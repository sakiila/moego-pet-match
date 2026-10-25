import type { AchievementRarity } from '../../game/achievementRarity';
import { useI18n } from '../../i18n';
import styles from './RarityTag.module.css';

export function RarityTag({ rarity, compact = false, className = '' }: { rarity: AchievementRarity; compact?: boolean; className?: string }) {
  const { t } = useI18n();
  return <span className={`${styles.tag} ${compact ? styles.compact : ''} ${className}`} data-rarity={rarity}>
    {t(`achievement.rarity_${rarity}`)}
  </span>;
}
