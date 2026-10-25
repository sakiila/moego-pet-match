import type { ReactNode } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { translate } from '../../i18n';
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
    'shop · developer egg: Maodu line': () => wrap(<ManagerCard name="Maodu 毛肚" stickerSrc={src} line={translate('zh', 'home.manager_line_maodu')} />),
    'shop · developer egg: Boluo line (en)': () => wrap(<ManagerCard name="Boluo 菠萝" stickerSrc={src} line={translate('en', 'home.manager_line_boluo')} />),
    'shop, image error': () => wrap(<ManagerCard name="Sanxian" stickerSrc="/missing.png" />),
    signature: () => wrap(<ManagerCard name="Sanxian" stickerSrc={src} variant="signature" />),
  },
};
export default entry;
