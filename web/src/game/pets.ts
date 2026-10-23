import type { GameMode, LineupPet } from '../api/types';

/** 棋盘与展示用的宠物（或鱼色）信息。 */
export interface PetInfo {
  id: string;
  name: string;
  /** 鱼色的英文名；宠物名保留原文。 */
  nameEn?: string;
  /** 透明贴纸地址前缀（不含尺寸），如 /img/pets/<id>；无贴纸时用 emoji 占位。 */
  imageBase?: string;
  emoji: string;
}

/** 阶段 1 的 6 个占位宠物（陈列页与本地预设仍使用）。 */
export const PLACEHOLDER_PETS: PetInfo[] = [
  { id: 'mochi', name: 'Mochi', emoji: '🐶' },
  { id: 'tofu', name: 'Tofu', emoji: '🐱' },
  { id: 'kiwi', name: 'Kiwi', emoji: '🐦' },
  { id: 'peanut', name: 'Peanut', emoji: '🐹' },
  { id: 'luna', name: 'Luna', emoji: '🐰' },
  { id: 'pepper', name: 'Pepper', emoji: '🦊' },
];

export const petById = (id: string) => PLACEHOLDER_PETS.find((p) => p.id === id)!;

/** 服务端阵容 → 展示信息：贴纸经自有域名 /img 代理；占位宠物沿用 emoji。 */
export function petFromLineup(pet: LineupPet, mode: GameMode = 'normal'): PetInfo {
  const placeholder = PLACEHOLDER_PETS.find((p) => p.id === pet.petId);
  if (placeholder) return placeholder;
  return {
    id: pet.petId,
    name: pet.name,
    nameEn: pet.nameEn,
    imageBase: `/img/${mode === 'fish' ? 'fish' : 'pets'}/${encodeURIComponent(pet.petId)}`,
    emoji: mode === 'fish' ? '🐟' : '🐾',
  };
}

export const petImage = (pet: PetInfo, size: 128 | 512 | 1024) => (pet.imageBase ? `${pet.imageBase}/${size}` : null);

export const petDisplayName = (pet: PetInfo, locale: 'zh' | 'en') => (locale === 'en' && pet.nameEn ? pet.nameEn : pet.name);

/** 开局前预加载本局棋盘贴纸；任一失败则视为素材未就绪。 */
export async function preloadPets(pets: PetInfo[], size: 128 | 512 = 128): Promise<void> {
  await Promise.all(
    pets.map((p) => {
      const src = petImage(p, size);
      if (!src) return Promise.resolve();
      const img = new Image();
      img.src = src;
      return img.decode();
    }),
  );
}
