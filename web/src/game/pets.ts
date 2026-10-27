import type { GameMode, LineupPet } from '../api/types';
import { stickerImageUrl, STICKER_WEBP_QUERY } from './stickerImage';

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
export const stickerUrl = (petId: string, size: 128 | 512 | 1024) => stickerImageUrl('pets', petId, size);
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

export const petImage = (pet: PetInfo, size: 128 | 512 | 1024) => (pet.imageBase ? `${pet.imageBase}/${size}?${STICKER_WEBP_QUERY}` : null);

export const petDisplayName = (pet: PetInfo, locale: 'zh' | 'en') => (locale === 'en' && pet.nameEn ? pet.nameEn : pet.name);

const PRELOAD_TIMEOUT_MS = 10_000;
const OPTIONAL_IMAGE_RETRY_MS = 30_000;
const pendingPetImages = new Map<string, { image: HTMLImageElement; promise: Promise<void> }>();
const shownPetImages = new Set<string>();

/** 本页已成功加载过的贴纸可直接显示；其余先显示表情，避免开局放行后出现空白棋子。 */
export const petImageShown = (src: string) => shownPetImages.has(src);
export const markPetImageShown = (src: string) => { shownPetImages.add(src); };
const optionalImageFailures = new Map<string, number>();

/**
 * 同一 URL 只合并正在加载的请求；下一轮仍确认浏览器中的图片可用。
 * 用 load/error 而非 decode()：页面在后台时 decode 可能一直不返回。
 */
export function loadPetImage(src: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  if (typeof Image === 'undefined') return Promise.resolve();
  if (priority === 'high') optionalImageFailures.delete(src);
  else if ((optionalImageFailures.get(src) ?? 0) > Date.now()) return Promise.reject(new Error('image upgrade is cooling down'));
  const pending = pendingPetImages.get(src);
  if (pending) {
    if (priority === 'high') pending.image.fetchPriority = 'high';
    return pending.promise;
  }
  const image = new Image();
  image.fetchPriority = priority;
  const promise = new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      image.onload = image.onerror = null;
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => finish(new Error('preload timeout')), PRELOAD_TIMEOUT_MS);
    image.onload = () => finish();
    image.onerror = () => finish(new Error(`failed to load ${src}`));
    image.src = src;
  });
  pendingPetImages.set(src, { image, promise });
  void promise.then(() => {
    pendingPetImages.delete(src);
    shownPetImages.add(src);
    optionalImageFailures.delete(src);
  }, () => {
    pendingPetImages.delete(src);
    // 补落会不断挂载新棋子，高清失败时短暂退避，避免每个棋子都重新请求。
    if (image.fetchPriority !== 'high') optionalImageFailures.set(src, Date.now() + OPTIONAL_IMAGE_RETRY_MS);
  });
  return promise;
}

/** 开局只等待可直接显示的 128 贴纸；高清版由 PetTile 后台升级，失败不阻塞开局。 */
export async function preloadPets(pets: PetInfo[], size: 128 | 512 = 128): Promise<void> {
  await Promise.all(pets.map(pet => {
    const src = petImage(pet, size);
    return src ? loadPetImage(src, 'high') : Promise.resolve();
  }));
}

/** 正常冷启动不到 1 秒；超过这个时间多半是个别请求卡住，不值得让玩家干等。 */
export const LINEUP_WAIT_MS = 3_000;

/**
 * 开局准备：最多等 LINEUP_WAIT_MS 让小图就绪，到时或失败都放行。
 * 未就绪的贴纸由 PetTile 继续加载，失败时回退表情，不阻塞开局。
 */
export async function waitForLineup(pets: PetInfo[], waitMs = LINEUP_WAIT_MS): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    preloadPets(pets).catch(() => {}),
    new Promise<void>(resolve => { timer = setTimeout(resolve, waitMs); }),
  ]);
  clearTimeout(timer);
}
