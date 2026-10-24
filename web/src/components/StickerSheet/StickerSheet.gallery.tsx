import type { ReactNode } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { silhouetteUrl, stickerUrl } from '../../game/pets';
import { StickerSheet, type StickerSheetPet } from './StickerSheet';

// 本地开发库里按名字排前的 21 只（不是 8 的整数倍，看最后一行不满的样子）
const pets = [
  ['pet_c7ad902c2024', '7-Eleven'], ['pet_114ff5db9974', 'Anzai'], ['pet_71ce7af17c7d', 'Argyle'], ['pet_f5f6c9e3c89e', 'Baiwan'],
  ['pet_1710a8cbe992', 'Banban'], ['pet_7104fa8cdaea', 'Banjo'], ['pet_4e4381b099ae', 'Banner'], ['pet_2f55c03f6968', 'Boluo'],
  ['pet_d3bbe177ee97', 'Breck'], ['pet_3c58a114cf19', 'Buduo'], ['pet_17cf13619bc3', 'Casper'], ['pet_cb89c71dda1f', 'Charlie'],
  ['pet_0cf1e1de557e', 'Chip'], ['pet_51be764b2c96', 'Chowsi'], ['pet_ac715bd1f307', 'CreaM'], ['pet_b05057985e11', 'Deedee'],
  ['pet_f2c7532b05f6', 'Doujia'], ['pet_992543cf2058', 'Eleven'], ['pet_04451cc68636', 'Ellie'], ['pet_9fe7fae0b4b4', 'Elphaba'],
  ['pet_a963c0841e60', 'Elsa'],
] as const;

const sheet = (isCollected: (i: number) => boolean, broken = false): StickerSheetPet[] =>
  pets.map(([petId, name], i) => {
    const collected = isCollected(i);
    return { petId, name, collected, imageSrc: broken ? '/missing.png' : collected ? stickerUrl(petId, 128) : silhouetteUrl(petId, 128) };
  });

const frame = (children: ReactNode) => <div style={{ maxWidth: 358 }}>{children}</div>;
const noop = () => {};

const entry: GalleryEntry = {
  name: 'StickerSheet',
  group: 'components',
  states: {
    'some collected': () => frame(<StickerSheet playerName="Bob" pets={sheet((i) => [0, 3, 4, 7, 9, 12, 15, 16, 20].includes(i))} onOpen={noop} caption="按主人和宠物名排序 · 点贴纸看详情" />),
    'caption · en': () => frame(<StickerSheet playerName="Bob" pets={sheet((i) => i % 3 === 0)} onOpen={noop} caption="Sorted by owner, then pet name · Tap a sticker for details" />),
    'full album · 80 slots': () => frame(<StickerSheet playerName="Bob" pets={Array.from({ length: 80 }, (_, i) => ({ ...sheet((n) => n % 3 === 0)[i % pets.length], petId: `fixture-${i}` }))} onOpen={noop} />),
    'long player name': () => frame(<StickerSheet playerName="Alexandria Montgomery-Smith" pets={sheet((i) => i % 3 === 0)} onOpen={noop} />),
    'none collected': () => frame(<StickerSheet playerName="Bob" pets={sheet(() => false)} onOpen={noop} />),
    'all collected': () => frame(<StickerSheet playerName="Bob" pets={sheet(() => true)} onOpen={noop} />),
    'image error': () => frame(<StickerSheet playerName="Bob" pets={sheet((i) => i % 2 === 0, true)} onOpen={noop} />),
    empty: () => frame(<StickerSheet playerName="Bob" pets={[]} onOpen={noop} />),
  },
};
export default entry;
