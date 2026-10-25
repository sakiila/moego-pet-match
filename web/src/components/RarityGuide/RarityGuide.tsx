import type { AchievementRarity } from '../../game/achievementRarity';
import { useI18n } from '../../i18n';
import { RarityTag } from '../RarityTag/RarityTag';
import styles from './RarityGuide.module.css';

export function RarityGuide({ rarities }: { rarities: readonly AchievementRarity[] }) {
  const { t } = useI18n();
  if (!rarities.length) return null;
  return <div className={styles.guide} data-testid="rarity-guide">
    <p className={styles.caption}>{t('achievement.rarity_guide')}</p>
    <ol className={styles.scale}>
      {rarities.map((rarity, index) => <li key={rarity} className={styles.item}>
        {index > 0 && <span className={styles.arrow} aria-hidden>→</span>}
        <RarityTag rarity={rarity} compact />
      </li>)}
    </ol>
  </div>;
}
