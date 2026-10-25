import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_DISPLAY_ORDER } from '../../game/achievementRarity';
import { PlayerProfileBadge } from './PlayerProfileBadge';
import styles from './PlayerProfileCard.module.css';

const entry: GalleryEntry = {
  name: 'PlayerProfileBadge',
  group: 'components',
  states: {
    'hover · tap · keyboard focus': () => <ul className={styles.badges}>{ACHIEVEMENT_DISPLAY_ORDER.map(id => <li key={id}><PlayerProfileBadge id={id} /></li>)}</ul>,
    'equipped title': () => <PlayerProfileBadge id="friends" chip />,
    'long condition': () => <PlayerProfileBadge id="family" />,
  },
};
export default entry;
