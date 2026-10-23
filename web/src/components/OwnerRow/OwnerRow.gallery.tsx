import type { GalleryEntry } from '../../dev/gallery/types';
import { OwnerRow } from './OwnerRow';

const entry: GalleryEntry = {
  name: 'OwnerRow',
  group: 'components',
  states: {
    default: () => <OwnerRow name="Bob 包博" userId="U03FPQWGTN2" avatarSrc="/img/avatars/U03FPQWGTN2" />,
    'no avatar · long name': () => <OwnerRow name="Alexandria Montgomery-Smith" userId="U_X" avatarSrc="/missing.png" />,
  },
};
export default entry;
