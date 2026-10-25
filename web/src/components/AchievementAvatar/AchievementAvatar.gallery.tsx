import type { GalleryEntry } from '../../dev/gallery/types';
import { ACHIEVEMENT_DISPLAY_ORDER } from '../../game/achievementRarity';
import { AchievementAvatar } from './AchievementAvatar';

const entry: GalleryEntry = { name: 'AchievementAvatar', group: 'components', states: {
  default: () => <AchievementAvatar name="Bob" />,
  'all seven · 40px / 22px': () => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>{ACHIEVEMENT_DISPLAY_ORDER.map(id => <AchievementAvatar key={id} name="Bob" equippedTitle={id} />)}</div>,
  'legendary': () => <AchievementAvatar name="Bob" equippedTitle="album" />,
  'missing photo': () => <AchievementAvatar name="小明" src="/missing-avatar.png" equippedTitle="cats" />,
  'long English name': () => <AchievementAvatar name="Alexandria Catherine Montgomery-Wellington" equippedTitle="species" />,
  'interactive': () => <AchievementAvatar name="Bob" equippedTitle="neighbors" onTitleClick={() => {}} />,
} };
export default entry;
