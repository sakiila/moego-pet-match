import type { ReactNode } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { ManagerCard } from './ManagerCard';

const src = '/img/pets/pet_4750baaed3f0/512';
const wrap = (node: ReactNode) => <div style={{ maxWidth: 390 }}>{node}</div>;

const entry: GalleryEntry = {
  name: 'ManagerCard',
  group: 'components',
  states: {
    shop: () => wrap(<ManagerCard name="Sanxian" stickerSrc={src} />),
    'shop · clickable (opens poster)': () => wrap(<ManagerCard name="Sanxian" stickerSrc={src} onOpen={() => alert('poster')} />),
    'shop, long name': () => wrap(<ManagerCard name="Sir Fluffington" stickerSrc={src} />),
    'shop, image error': () => wrap(<ManagerCard name="Sanxian" stickerSrc="/missing.png" />),
    signature: () => wrap(<ManagerCard name="Sanxian" stickerSrc={src} variant="signature" />),
  },
};
export default entry;
