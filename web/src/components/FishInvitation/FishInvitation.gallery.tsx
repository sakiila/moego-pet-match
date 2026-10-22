import type { GalleryEntry } from '../../dev/gallery/types';
import { FishInvitation } from './FishInvitation';

const entry: GalleryEntry = { name: 'FishInvitation', group: 'components', states: { default: () => <FishInvitation /> } };
export default entry;
