import type { PetInfo } from '../game/pets';

/** 准备页设计验收的已上架阵容，只在开发陈列页使用。 */
export const PREVIEW_PREP_PETS: PetInfo[] = [
  ['pet_b05057985e11', 'Deedee'],
  ['pet_644053d683e0', 'Maodu'],
  ['pet_2f55c03f6968', 'Boluo'],
  ['pet_1f0d8cd4616f', 'Momo'],
  ['pet_5746e9824aff', 'Marley'],
  ['pet_96dfee09ae8a', 'Koa'],
].map(([id, name]) => ({ id, name, imageBase: `/img/pets/${id}`, emoji: '' }));
