import type { PlayerView } from '../../api/types';
import type { PlayerLikesState } from '../../game/playerLikes';
import { avatarUrl } from '../../game/pets';
import { useI18n } from '../../i18n';
import { PlayerLikesPill } from '../PlayerLikes/PlayerLikes';
import { PlayerMenu } from '../PlayerMenu/PlayerMenu';
import styles from './HomePlayerActions.module.css';

export interface HomePlayerActionsProps {
  player: PlayerView;
  likes: PlayerLikesState;
  onProfile: () => void;
  onClockOut: () => void;
  onTitles?: () => void;
  /** 动态墙开放时提供，菜单出现「我的动态」。 */
  onMyPosts?: () => void;
}

export function HomePlayerActions({ player, likes, onProfile, onClockOut, onTitles, onMyPosts }: HomePlayerActionsProps) {
  const { t } = useI18n();
  return <span className={styles.root}>
    <PlayerLikesPill state={likes} onOpen={onProfile} />
    <PlayerMenu name={player.name} userId={player.userId} avatarSrc={avatarUrl(player.userId)} onClockOut={onClockOut} equippedTitle={player.equippedTitle} onTitles={onTitles}
      actions={onMyPosts ? [{ icon: 'paw-print', label: t('social.my_posts'), onClick: onMyPosts }] : []} />
  </span>;
}
