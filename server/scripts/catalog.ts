/**
 * 素材上下架（本地运行）：
 *   tsx scripts/catalog.ts publish [pet_id...] [--yes] [--prod]   上架全部或指定宠物与鱼色（只增不减；墓碑宠物一律跳过，指定墓碑 pet_id 时拒绝）
 *   tsx scripts/catalog.ts unpublish <pet_id> [--yes] [--prod]   核实删除申请后下架：记录清成墓碑，删除贴纸与卡背照片对象，
 *                                                               共用原图的宠物去掉卡背照片，只剩一只的家庭解散
 * 默认写本地开发库与本地对象存储（server/.store）；--prod 写 生产 PostgreSQL（管理员连接），对象存储由 OBJECT_STORE 决定。
 * 不加 --yes 只列出变更，不写入。
 */
import { readFile } from 'node:fs/promises';
import { buildCatalog, excludeRemoved, SIZES, type FishRecord, type PetRecord } from '../src/catalog/build.ts';
import { coatOf, type Coat } from '../src/catalog/coat.ts';
import { makeCardPhoto } from '../src/catalog/photo.ts';
import { applyUnpublish, planUnpublish } from '../src/catalog/unpublish.ts';
import { connect, describeTarget, storeFromEnv } from './cli.ts';
import { createImageCdnPurger } from '../src/services/imageCdn.ts';

const args = process.argv.slice(2);
const cmd = args[0];
const yes = args.includes('--yes');
const prod = args.includes('--prod');
const ids = args.slice(1).filter((a) => !a.startsWith('--'));

const client = await connect(prod);
const store = storeFromEnv();
console.log(describeTarget(prod, yes));

async function uploadSticker(s: PetRecord['sticker']) {
  for (const size of SIZES) {
    const key = `${s.key}/${size}.png`;
    if (await store.get(key)) continue;
    await store.put(key, await readFile(s.files[size]), 'image/png');
  }
}

try {
  if (cmd === 'publish') {
    const { pets: allPets, fish } = buildCatalog();
    const current = new Map((await client.query('SELECT * FROM pet_match.pets')).rows.map((r) => [r.pet_id, r]));
    // 已成墓碑的宠物不得重新上架；同时据此重算家庭、屏蔽与墓碑共用的原图
    const removedIds = new Set([...current.values()].filter((r) => r.status === 'removed').map((r) => r.pet_id as string));
    const askedRemoved = ids.filter((id) => removedIds.has(id));
    if (askedRemoved.length) throw new Error(`refusing to publish removed pets: ${askedRemoved.join(', ')}`);
    const { kept: pets, removed, blockedOriginal } = excludeRemoved(allPets, removedIds);
    if (removed.length) console.log(`skipped removed (tombstone) pets: ${removed.map((p) => `${p.pet_id} ${p.name}`).join(', ')} — also delete them from the local catalog and assets/pets`);
    if (blockedOriginal.length) console.log(`no card photo (original shared with a removed pet): ${blockedOriginal.join(', ')}`);
    const selected = ids.length ? pets.filter((p) => ids.includes(p.pet_id)) : pets;
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
    // 卡背照片：缺失或原图变化时生成；多宠共用同一张原图时列出供过目（含人像等不宜展示的需人工替换）
    const photoPlan = new Map<string, { key: string; body: Buffer }>();
    for (const p of selected) {
      if (!p.original) continue;
      const photo = await makeCardPhoto(p.original);
      const key = `photos/${p.pet_id}/${photo.hash}.jpg`;
      if (current.get(p.pet_id)?.photo_key !== key) photoPlan.set(p.pet_id, { key, body: photo.body });
    }
    // 毛色特征：从 128 px 贴纸计算；缺失或变化时写入（real[] 回读有浮点误差，按容差比较）
    const sameCoat = (a: number[] | null | undefined, b: Coat) => !!a && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-3);
    const coatPlan = new Map<string, Coat>();
    for (const p of selected) {
      const coat = await coatOf(await readFile(p.sticker.files['128']));
      if (!sameCoat(current.get(p.pet_id)?.coat, coat)) coatPlan.set(p.pet_id, coat);
    }
    const shared = new Map<string, string[]>();
    for (const p of selected) if (p.original) shared.set(p.original, [...(shared.get(p.original) ?? []), p.name]);
    const sharedList = [...shared.entries()].filter(([, names]) => names.length > 1);
    for (const x of plan) if (x.action === 'unchanged' && (photoPlan.has(x.p.pet_id) || coatPlan.has(x.p.pet_id))) x.action = 'update';
    const by = (a: string) => plan.filter((x) => x.action === a);
    console.log(`pets: insert ${by('insert').length}, update ${by('update').length}, unchanged ${by('unchanged').length}`);
    for (const x of [...by('insert'), ...by('update')]) console.log(`  ${x.action.padEnd(6)} ${x.p.pet_id} ${x.p.name} (owner ${x.p.owner_user_id}${x.p.family_id ? ', family' : ''})`);
    const fishRows = new Map((await client.query('SELECT * FROM pet_match.fish_colors')).rows.map((r) => [r.color_id, r]));
    const fishPlan = ids.length ? [] : fish.filter((f) => fishRows.get(f.color_id)?.sticker_key !== f.sticker.key);
    console.log(`card photos to (re)generate: ${photoPlan.size}`);
    console.log(`coat features to write: ${coatPlan.size}`);
    if (sharedList.length) {
      console.log(`shared original photos (please review): ${sharedList.length}`);
      for (const [, names] of sharedList) console.log(`  ${names.join(' / ')}`);
    }
    console.log(`fish colors: upsert ${fishPlan.length} of ${fish.length}`);
    if (yes) {
      for (const { p, action } of plan) {
        if (action === 'unchanged') continue;
        await uploadSticker(p.sticker);
        const photo = photoPlan.get(p.pet_id);
        if (photo) await store.put(photo.key, photo.body, 'image/jpeg');
        // 上架变更与爪印写入同序取锁；先锁宠物身份，再由 INSERT/UPDATE 取得行锁。
        await client.query("SELECT pg_advisory_lock(hashtextextended('pet-paw:' || $1,0))", [p.pet_id]);
        try {
          await client.query(
            `INSERT INTO pet_match.pets (pet_id, name, owner_user_id, family_id, species, intro, owner_quote, sticker_key, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published')
             ON CONFLICT (pet_id) DO UPDATE SET name = EXCLUDED.name, owner_user_id = EXCLUDED.owner_user_id, family_id = EXCLUDED.family_id,
               species = EXCLUDED.species, intro = EXCLUDED.intro, owner_quote = EXCLUDED.owner_quote, sticker_key = EXCLUDED.sticker_key,
               status = 'published', updated_at = now()`,
            [p.pet_id, p.name, p.owner_user_id, p.family_id, p.species, p.intro, p.owner_quote, p.sticker.key],
          );
          if (photo) await client.query('UPDATE pet_match.pets SET photo_key = $2 WHERE pet_id = $1', [p.pet_id, photo.key]);
          const coat = coatPlan.get(p.pet_id);
          if (coat) await client.query('UPDATE pet_match.pets SET coat = $2 WHERE pet_id = $1', [p.pet_id, coat]);
        } finally {
          await client.query("SELECT pg_advisory_unlock(hashtextextended('pet-paw:' || $1,0))", [p.pet_id]);
        }
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
    const plan = await planUnpublish(client, ids[0]);
    console.log(`unpublish ${plan.petId} ${plan.name} (owner ${plan.ownerUserId ?? '-'}) → tombstone`);
    console.log(`  objects to delete: ${plan.objects.length}`);
    for (const k of plan.objects) console.log(`    ${k}`);
    if (plan.sharedPhoto.length) console.log(`  card photo removed too (same original photo): ${plan.sharedPhoto.map((s) => `${s.petId} ${s.name}`).join(', ')}`);
    if (plan.familyDissolves.length) console.log(`  family dissolves (only one pet left): ${plan.familyDissolves.map((s) => `${s.petId} ${s.name}`).join(', ')}`);
    if (plan.managerDates.length) console.log(`  was manager on: ${plan.managerDates.join(', ')} (today's manager is reselected automatically)`);
    console.log(`  pending deletion requests: ${plan.pendingRequests.map((r) => r.requestId).join(', ') || 'none'} — resolve with deletions.ts after cleanup`);
    if (yes) {
      // 缺少清缓存配置时，在改数据库之前停止。
      const purge = prod ? createImageCdnPurger() : undefined;
      const { failed, cdnPurged } = await applyUnpublish(client, store, plan, purge);
      console.log(failed.length ? `applied; objects NOT deleted (retry by hand): ${failed.join(', ')}` : 'applied.');
      if (cdnPurged === false) {
        console.error(`Pet removed, but CDN purge failed. Retry: scripts/image-cache.ts purge ${plan.petId} --prod --yes`);
        process.exitCode = 1;
      } else if (cdnPurged) console.log('CDN sticker cache purged.');
      console.log('Also: mark the pet removed in the local catalog, delete its files under assets/pets, and check copies you downloaded for processing.');
    }
  } else {
    console.log('usage: catalog.ts publish [pet_id...] [--yes] [--prod] | unpublish <pet_id> [--yes] [--prod]');
  }
} finally {
  await client.end();
}
