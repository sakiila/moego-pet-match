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

/** 6 种鱼色（陈列页示例；线上以服务端 fish_colors 为准）。 */
export const SAMPLE_FISH: PetInfo[] = [
  ['red', '珊瑚红', 'Coral Red'],
  ['gold', '金黄色', 'Golden Yellow'],
  ['green', '翡翠绿', 'Emerald Green'],
  ['blue', '天蓝色', 'Sky Blue'],
  ['purple', '紫罗兰', 'Violet'],
  ['panda', '黑白色', 'Black and White'],
].map(([c, name, nameEn]) => ({ id: `fish_color_${c}`, name, nameEn, imageBase: `/img/fish/fish_color_${c}`, emoji: '🐟' }));

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

/** 普通宠物的贴纸、剪影与处理后照片地址（均经自有域名 /img 代理）。 */
export const stickerUrl = (petId: string, size: 128 | 512 | 1024) => `/img/pets/${encodeURIComponent(petId)}/${size}`;
export const silhouetteUrl = (petId: string, size: 128 | 512 | 1024) => `/img/silhouettes/${encodeURIComponent(petId)}/${size}`;
export const photoUrl = (petId: string, playerId: string) =>
  `/img/photos/${encodeURIComponent(petId)}?playerId=${encodeURIComponent(playerId)}`;
export const avatarUrl = (userId: string) => `/img/avatars/${encodeURIComponent(userId)}`;

const preloaded = new Set<string>();
/** 提前把图片拉进浏览器缓存并解码（如手指按下贴纸时预取详情大图）；同一地址只发一次。 */
export function preloadImage(src: string) {
  if (preloaded.has(src) || typeof Image === 'undefined') return;
  preloaded.add(src);
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  void img.decode().catch(() => preloaded.delete(src));
}

export const petImage = (pet: PetInfo, size: 128 | 512 | 1024) => (pet.imageBase ? `${pet.imageBase}/${size}` : null);

export const petDisplayName = (pet: PetInfo, locale: 'zh' | 'en') => (locale === 'en' && pet.nameEn ? pet.nameEn : pet.name);

const PRELOAD_TIMEOUT_MS = 10_000;

/**
 * 开局前预加载本局棋盘贴纸；任一失败或超时视为素材未就绪（准备页显示可重试）。
 * 默认等待128与512两档都就绪，覆盖放大棋盘；指定size时只加载该档。
 * 用 load/error 事件而非 decode()：页面在后台时 decode 可能一直不返回。
 */
export async function preloadPets(pets: PetInfo[], size?: 128 | 512): Promise<void> {
  const sizes: readonly (128 | 512)[] = size === undefined ? [128, 512] : [size];
  const loads = pets.flatMap((p) => sizes.map((imageSize) => {
    const src = petImage(p, imageSize);
    if (!src) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`failed to load ${src}`));
      img.src = src;
    });
  }));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('preload timeout')), PRELOAD_TIMEOUT_MS);
  });
  try {
    await Promise.race([Promise.all(loads), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
