import type { AchievementId } from '../../api/types';
import { useI18n, type MessageKey } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './AchievementBadge.module.css';

export const achievementName = (id: AchievementId) => `achievement.${id}` as MessageKey;
export const achievementCondition = (id: AchievementId) => `achievement.${id}_condition` as MessageKey;

/** 已确认原稿的徽章图片；文字保持 i18n，未解锁仅将同一 PNG 灰显。 */
export function AchievementBadge({ id, chip = false, large = false, locked = false, rarity = false }: { id: AchievementId; chip?: boolean; large?: boolean; locked?: boolean; rarity?: boolean }) {
  const { t } = useI18n();
  return (
    <span className={`${styles.badge} ${chip ? styles.chip : ''} ${locked ? styles.locked : ''}`} title={t(achievementName(id))}>
      <Icon name={rarity ? `title-${id}-showcase` : `title-${id}`} size={chip ? 24 : large ? 72 : 48} label={chip ? undefined : t(achievementName(id))} />
      {chip && <span className={styles.name}>{t(achievementName(id))}</span>}
    </span>
  );
}
