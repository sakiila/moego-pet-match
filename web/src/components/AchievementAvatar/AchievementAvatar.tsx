import type { AchievementId } from '../../api/types';
import { useI18n } from '../../i18n';
import { Avatar, type AvatarProps } from '../../ui/primitives/Avatar';
import { Icon } from '../../ui/primitives/Icon';
import { achievementName } from '../AchievementBadge/AchievementBadge';
import styles from './AchievementAvatar.module.css';

export interface AchievementAvatarProps extends Omit<AvatarProps, 'size'> {
  equippedTitle?: AchievementId | null;
  onTitleClick?: () => void;
}

/** C 档：40px 头像，22px 徽章中心贴住右下 45° 圆周。 */
export function AchievementAvatar({ equippedTitle, onTitleClick, ...avatar }: AchievementAvatarProps) {
  const { t } = useI18n();
  const badge = equippedTitle ? <Icon name={`title-${equippedTitle}-avatar`} size={22} label={onTitleClick ? undefined : t(achievementName(equippedTitle))} /> : null;
  return (
    <span className={styles.root}>
      <Avatar {...avatar} size={40} />
      {equippedTitle && (onTitleClick ? (
        <button type="button" className={`${styles.marker} ${styles.interactive}`} onClick={onTitleClick}
          aria-label={t('achievement.view_worn', { playerName: avatar.name, title: t(achievementName(equippedTitle)) })}>
          {badge}
        </button>
      ) : <span className={styles.marker} title={t(achievementName(equippedTitle))}>{badge}</span>)}
    </span>
  );
}
