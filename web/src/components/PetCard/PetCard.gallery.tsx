import type { ReactNode } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { PetCard } from './PetCard';

const grid = (children: ReactNode) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 390 }}>{children}</div>;
const owner = { name: 'Bob Bao', userId: 'U_TEST_BOB', avatarSrc: '/img/avatars/U_TEST_BOB' };

const entry: GalleryEntry = {
  name: 'PetCard',
  group: 'components',
  states: {
    'collected / uncollected': () =>
      grid(
        <>
          <PetCard name="Sanxian" collected imageSrc="/img/pets/pet_4750baaed3f0/512" owner={owner} onOpen={() => {}} />
          <PetCard name="7-Eleven" collected={false} imageSrc="/img/silhouettes/pet_c7ad902c2024/512" onOpen={() => {}} />
        </>,
      ),
    'collected without owner': () =>
      grid(<PetCard name="Shiliu" collected imageSrc="/img/pets/pet_cfb67d9ae65b/512" owner={null} onOpen={() => {}} />),
    'developer egg: Maodu (collected) / Boluo (not collected)': () =>
      grid(
        <>
          <PetCard name="Maodu 毛肚" collected imageSrc="/img/pets/pet_644053d683e0/512" owner={{ name: 'Bob 包博', userId: 'U03FPQWGTN2', avatarSrc: '/img/avatars/U03FPQWGTN2' }} developer onOpen={() => {}} />
          <PetCard name="Boluo 菠萝" collected={false} imageSrc="/img/silhouettes/pet_2f55c03f6968/512" developer onOpen={() => {}} />
        </>,
      ),
    'long names / image error': () =>
      grid(
        <>
          <PetCard name="Sir Fluffington the Third" collected imageSrc="/missing.png" owner={{ ...owner, name: 'Alexandria Montgomery-Smith' }} onOpen={() => {}} />
          <PetCard name="Supercalifragilistic" collected={false} imageSrc="/missing.png" onOpen={() => {}} />
        </>,
      ),
  },
};
export default entry;
