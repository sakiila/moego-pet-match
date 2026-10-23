/**
 * 素材上下架（本地运行）：
 *   tsx scripts/catalog.ts publish [pet_id...] [--yes] [--prod]   上架全部或指定宠物与鱼色（只增不减）
 *   tsx scripts/catalog.ts unpublish <pet_id> [--yes] [--prod]   显式下架并删除贴纸对象
 * 默认写本地开发库与本地对象存储（server/.store）；--prod 写 Supabase（管理员连接），对象存储由 OBJECT_STORE 决定。
 * 不加 --yes 只列出变更，不写入。
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { buildCatalog, SIZES, type FishRecord, type PetRecord } from '../src/catalog/build.ts';
import { LOCAL_DEV_URL } from '../src/config.ts';
import { readSupabaseAdminConfig } from '../src/db/adminUrl.ts';
import { localDirStore } from '../src/storage/localDirStore.ts';
import { r2Store, type ObjectStore } from '../src/storage/objectStore.ts';
import { r2FromEnv } from '../src/storage/r2.ts';

const args = process.argv.slice(2);
const cmd = args[0];
const yes = args.includes('--yes');
const prod = args.includes('--prod');
const ids = args.slice(1).filter((a) => !a.startsWith('--'));

function storeFromEnv(): ObjectStore {
  if (process.env.OBJECT_STORE === 'r2') {
    const r2 = r2FromEnv();
    if (!r2) throw new Error('R2 not configured');
    return r2Store(r2);
  }
  return localDirStore(process.env.OBJECT_STORE_DIR ?? fileURLToPath(new URL('../.store/', import.meta.url)));
}

const client = new pg.Client(prod ? readSupabaseAdminConfig() : { connectionString: process.env.DATABASE_URL ?? LOCAL_DEV_URL });
await client.connect();
const store = storeFromEnv();
console.log(`target: ${prod ? 'Supabase (prod)' : 'local dev'} · store: ${process.env.OBJECT_STORE === 'r2' ? 'R2' : 'local dir'}${yes ? '' : ' · DRY RUN'}`);

async function uploadSticker(s: PetRecord['sticker']) {
  for (const size of SIZES) {
    const key = `${s.key}/${size}.png`;
    if (await store.get(key)) continue;
    await store.put(key, await readFile(s.files[size]), 'image/png');
  }
}

try {
  if (cmd === 'publish') {
    const { pets, fish } = buildCatalog();
    const selected = ids.length ? pets.filter((p) => ids.includes(p.pet_id)) : pets;
    const current = new Map((await client.query('SELECT * FROM pet_match.pets')).rows.map((r) => [r.pet_id, r]));
    const fields = ['name', 'owner_user_id', 'family_id', 'species', 'intro', 'owner_quote'] as const;
    const plan = selected.map((p) => {
      const row = current.get(p.pet_id);
      const action = !row
        ? 'insert'
        : row.status !== 'published' || row.sticker_key !== p.sticker.key || fields.some((f) => (row[f] ?? null) !== p[f])
          ? 'update'
          : 'unchanged';
      return { p, action };
    });
    const by = (a: string) => plan.filter((x) => x.action === a);
    console.log(`pets: insert ${by('insert').length}, update ${by('update').length}, unchanged ${by('unchanged').length}`);
    for (const x of [...by('insert'), ...by('update')]) console.log(`  ${x.action.padEnd(6)} ${x.p.pet_id} ${x.p.name} (owner ${x.p.owner_user_id}${x.p.family_id ? ', family' : ''})`);
    const fishRows = new Map((await client.query('SELECT * FROM pet_match.fish_colors')).rows.map((r) => [r.color_id, r]));
    const fishPlan = ids.length ? [] : fish.filter((f) => fishRows.get(f.color_id)?.sticker_key !== f.sticker.key);
    console.log(`fish colors: upsert ${fishPlan.length} of ${fish.length}`);
    if (yes) {
      for (const { p, action } of plan) {
        if (action === 'unchanged') continue;
        await uploadSticker(p.sticker);
        await client.query(
          `INSERT INTO pet_match.pets (pet_id, name, owner_user_id, family_id, species, intro, owner_quote, sticker_key, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published')
           ON CONFLICT (pet_id) DO UPDATE SET name = EXCLUDED.name, owner_user_id = EXCLUDED.owner_user_id, family_id = EXCLUDED.family_id,
             species = EXCLUDED.species, intro = EXCLUDED.intro, owner_quote = EXCLUDED.owner_quote, sticker_key = EXCLUDED.sticker_key,
             status = 'published', updated_at = now()`,
          [p.pet_id, p.name, p.owner_user_id, p.family_id, p.species, p.intro, p.owner_quote, p.sticker.key],
        );
      }
      for (const f of fishPlan as FishRecord[]) {
        await uploadSticker(f.sticker);
        await client.query(
          `INSERT INTO pet_match.fish_colors (color_id, name_zh, name_en, palette_hex, sticker_key) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (color_id) DO UPDATE SET name_zh = EXCLUDED.name_zh, name_en = EXCLUDED.name_en, palette_hex = EXCLUDED.palette_hex, sticker_key = EXCLUDED.sticker_key, status = 'published'`,
          [f.color_id, f.name_zh, f.name_en, f.palette_hex, f.sticker.key],
        );
      }
      console.log('applied.');
    }
  } else if (cmd === 'unpublish') {
    if (ids.length !== 1) throw new Error('usage: unpublish <pet_id>');
    const row = (await client.query('SELECT pet_id, name, status, sticker_key FROM pet_match.pets WHERE pet_id = $1', [ids[0]])).rows[0];
    if (!row) throw new Error(`unknown pet ${ids[0]}`);
    console.log(`unpublish ${row.pet_id} ${row.name} (status ${row.status}); delete ${row.sticker_key ? SIZES.length : 0} sticker objects`);
    if (yes) {
      await client.query(`UPDATE pet_match.pets SET status = 'unpublished', updated_at = now() WHERE pet_id = $1`, [row.pet_id]);
      if (row.sticker_key) for (const s of SIZES) await store.delete(`${row.sticker_key}/${s}.png`);
      console.log('applied.');
    }
  } else {
    console.log('usage: catalog.ts publish [pet_id...] [--yes] [--prod] | unpublish <pet_id> [--yes] [--prod]');
  }
} finally {
  await client.end();
}
