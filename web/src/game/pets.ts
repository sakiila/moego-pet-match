/** 阶段 1 的 6 个占位宠物；阶段 3 换成核对后的真实宠物与透明 PNG 贴纸。 */
export interface PetInfo {
  id: string;
  name: string;
  /** 占位头像，正式素材接入后替换为图片地址。 */
  emoji: string;
}

export const PLACEHOLDER_PETS: PetInfo[] = [
  { id: 'mochi', name: 'Mochi', emoji: '🐶' },
  { id: 'tofu', name: 'Tofu', emoji: '🐱' },
  { id: 'kiwi', name: 'Kiwi', emoji: '🐦' },
  { id: 'peanut', name: 'Peanut', emoji: '🐹' },
  { id: 'luna', name: 'Luna', emoji: '🐰' },
  { id: 'pepper', name: 'Pepper', emoji: '🦊' },
];

export const petById = (id: string) => PLACEHOLDER_PETS.find((p) => p.id === id)!;

/** 服务端阵容 → 展示信息：占位宠物用 emoji，正式宠物在阶段 3 接入贴纸。 */
export function petFromLineup(pet: { petId: string; name: string }): PetInfo {
  return PLACEHOLDER_PETS.find((p) => p.id === pet.petId) ?? { id: pet.petId, name: pet.name, emoji: '🐾' };
}
