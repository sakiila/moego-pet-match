import type { GalleryEntry } from '../../dev/gallery/types';
import { DeletionRequestSheet } from './DeletionRequestSheet';

const pet = { name: 'Maodu', stickerSrc: '/img/pets/pet_644053d683e0/512', ownerName: 'Bob 包博' };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const entry: GalleryEntry = {
  name: 'DeletionRequestSheet',
  group: 'components',
  states: {
    'pet (submit succeeds)': () => <DeletionRequestSheet open inline pet={pet} onSubmit={() => wait(500)} onClose={() => {}} />,
    'pet (submit fails)': () => <DeletionRequestSheet open inline pet={pet} onSubmit={async () => { await wait(300); throw new Error('x'); }} onClose={() => {}} />,
    'general request': () => <DeletionRequestSheet open inline pet={null} onSubmit={() => wait(300)} onClose={() => {}} />,
    'long names': () => <DeletionRequestSheet open inline pet={{ ...pet, name: 'Sir Fluffington the Third', ownerName: 'Alexandria Montgomery-Smith' }} onSubmit={() => wait(300)} onClose={() => {}} />,
  },
};
export default entry;
