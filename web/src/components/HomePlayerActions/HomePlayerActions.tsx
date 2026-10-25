import type { PlayerView } from '../../api/types';
import type { PlayerLikesState } from '../../game/playerLikes';
import { avatarUrl } from '../../game/pets';
import { PlayerLikesPill } from '../PlayerLikes/PlayerLikes';
import { PlayerMenu } from '../PlayerMenu/PlayerMenu';
import styles from './HomePlayerActions.module.css';

export interface HomePlayerActionsProps {
  player: PlayerView;
  likes: PlayerLikesState;
  onProfile: () => void;
  onClockOut: () => void;
  onTitles?: () => void;
}

export function HomePlayerActions({ player, likes, onProfile, onClockOut, onTitles }: HomePlayerActionsProps) {
  return <span className={styles.root}>
    <PlayerLikesPill state={likes} onOpen={onProfile} />
    <PlayerMenu name={player.name} userId={player.userId} avatarSrc={avatarUrl(player.userId)} onClockOut={onClockOut} equippedTitle={player.equippedTitle} onTitles={onTitles} />
  </span>;
}
