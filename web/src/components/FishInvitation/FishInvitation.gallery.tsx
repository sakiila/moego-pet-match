import type { GalleryEntry } from '../../dev/gallery/types';
import { FishInvitation } from './FishInvitation';

const entry: GalleryEntry = { name: 'FishInvitation', group: 'components', states: { default: () => <FishInvitation onOpen={() => {}} />, 'text only': () => <FishInvitation /> } };
export default entry;
