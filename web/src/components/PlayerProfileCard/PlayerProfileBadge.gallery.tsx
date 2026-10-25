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
    'hidden title · viewer not unlocked (meow)': () => <PlayerProfileBadge id="hotpot" revealed={false} />,
    'hidden title chip · viewer not unlocked': () => <PlayerProfileBadge id="hotpot" chip revealed={false} />,
    'hidden title · viewer unlocked (real condition)': () => <PlayerProfileBadge id="hotpot" />,
  },
};
export default entry;
