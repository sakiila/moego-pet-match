import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
export const PATHS = {
  catalog: `${REPO}data/pet-materials/catalog-final-v4/moego-pet-catalog-final.json`,
  ownerMap: `${REPO}data/pet-materials/owner-slack-map.json`,
  stickers: `${REPO}assets/pets/stickers-b-head-active-v1/`,
  fish: `${REPO}assets/pets/fish-singles-v1/`,
};
export const SIZES = ['128', '512', '1024'] as const;

export interface StickerFiles {
  key: string;
  files: Record<(typeof SIZES)[number], string>;
}

export interface PetRecord {
  pet_id: string;
  name: string;
  owner_user_id: string;
  family_id: string | null;
  species: string | null;
  intro: string | null;
  owner_quote: string | null;
  sticker: StickerFiles;
}

export interface FishRecord {
  color_id: string;
  name_zh: string;
  name_en: string;
  palette_hex: string;
  sticker: StickerFiles;
}

const blank = (s: unknown) => (typeof s === 'string' && s.trim() ? s.trim() : null);

function sticker(prefix: string, id: string, dir: string, item: { files: Record<string, string>; file_metadata?: Record<string, { sha256: string }> }): StickerFiles {
  const sha = item.file_metadata?.['1024']?.sha256;
  if (!sha) throw new Error(`missing sha256 for ${id}`);
  return {
    key: `${prefix}/${id}/${sha.slice(0, 12)}`,
    files: Object.fromEntries(SIZES.map((s) => [s, dir + item.files[s]])) as StickerFiles['files'],
  };
}

/**
 * 读核对后的 v4 名录 + 当前有效贴纸 + 已确认的主人对应表，得到应上架的普通宠物与鱼色。
 * 重复 Banjo 按 duplicate_group 只保留 primary_decision = accept 的一条；鱼群档案不进入普通宠物池。
 */
export function buildCatalog(paths = PATHS): { pets: PetRecord[]; fish: FishRecord[] } {
  const catalog = JSON.parse(readFileSync(paths.catalog, 'utf8'));
  const ownerMap = JSON.parse(readFileSync(paths.ownerMap, 'utf8'));
  if (!ownerMap.confirmed) throw new Error('owner-slack-map.json is not confirmed yet');
  const slackOf = new Map<string, string>(ownerMap.owners.filter((o: { slack_user_id: string | null }) => o.slack_user_id).map((o: { owner_id: string; slack_user_id: string }) => [o.owner_id, o.slack_user_id]));
  const manifest = JSON.parse(readFileSync(`${paths.stickers}manifest.json`, 'utf8'));
  const stickerOf = new Map<string, { files: Record<string, string>; file_metadata: Record<string, { sha256: string }> }>(
    manifest.items.map((i: { pet_id: string }) => [i.pet_id, i]),
  );

  type Raw = { pet_id: string; name: string; kind: string; owner_ids: string[]; duplicate_group?: string; primary_decision?: string; species?: string; individual_intro_excerpt?: string; originalIntro?: string; owner_quote?: string };
  const raws: Raw[] = catalog.pets.filter(
    (p: Raw) => p.kind === 'pet_candidate' && (!p.duplicate_group || p.primary_decision === 'accept'),
  );
  const ownerOf = (p: Raw) => {
    const uid = slackOf.get(p.owner_ids[0]);
    if (!uid) throw new Error(`no confirmed Slack owner for ${p.pet_id} (${p.name})`);
    return uid;
  };
  const perOwner = new Map<string, number>();
  for (const p of raws) perOwner.set(ownerOf(p), (perOwner.get(ownerOf(p)) ?? 0) + 1);

  const pets = raws.map((p): PetRecord => {
    const s = stickerOf.get(p.pet_id);
    if (!s) throw new Error(`no sticker for ${p.pet_id}`);
    const owner = ownerOf(p);
    return {
      pet_id: p.pet_id,
      name: p.name,
      owner_user_id: owner,
      family_id: (perOwner.get(owner) ?? 0) >= 2 ? owner : null,
      species: blank(p.species),
      intro: blank(p.individual_intro_excerpt) ?? blank(p.originalIntro),
      owner_quote: blank(p.owner_quote),
      sticker: sticker('pets', p.pet_id, paths.stickers, s),
    };
  });

  const fishManifest = JSON.parse(readFileSync(`${paths.fish}manifest.json`, 'utf8'));
  const fish = (fishManifest.items as { asset_id: string; name_zh: string; name_en: string; palette_hex: string; files: Record<string, string>; file_metadata: Record<string, { sha256: string }> }[]).map(
    (f): FishRecord => ({
      color_id: f.asset_id,
      name_zh: f.name_zh,
      name_en: f.name_en,
      palette_hex: f.palette_hex,
      sticker: sticker('fish', f.asset_id, paths.fish, f),
    }),
  );
  return { pets, fish };
}
