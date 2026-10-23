import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RegisteredGame, ResultPayload } from '../../web/src/api/types.ts';
import { buildApp } from '../src/app.ts';
import { excludeRemoved, type PetRecord } from '../src/catalog/build.ts';
import { applyUnpublish, planUnpublish } from '../src/catalog/unpublish.ts';
import { dailyManager } from '../src/services/pets.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import { freshDatabase } from './helpers.ts';

// 真实可解码的透明 PNG（剪影要读透明通道）
const PNG = await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: 200, g: 120, b: 40, alpha: 1 } } }).png().toBuffer();
let ctx: Awaited<ReturnType<typeof freshDatabase>>;
let app: ReturnType<typeof buildApp>;
const store = memoryStore();
let cacheDir: string;

beforeAll(async () => {
  ctx = await freshDatabase();
  cacheDir = mkdtempSync(join(tmpdir(), 'pm-unpub-'));
  app = buildApp({ pool: ctx.pool, images: { cache: new DiskCache(cacheDir, 10 * 1024 * 1024), store, fetchAvatar: async () => null } });
  // 8 只上架宠物；mochi / tofu 同主一家，且共用同一张原图（照片哈希相同）
  await ctx.pool.query(`INSERT INTO pet_match.pets (pet_id, name, status) VALUES ('extra1', 'Extra1', 'published'), ('extra2', 'Extra2', 'published')`);
  await ctx.pool.query(`UPDATE pet_match.pets SET sticker_key = 'pets/' || pet_id || '/s1', photo_key = 'photos/' || pet_id || '/h' || pet_id || '.jpg'`);
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_ALICE', family_id = 'U_TEST_ALICE', photo_key = 'photos/' || pet_id || '/shared.jpg' WHERE pet_id IN ('mochi', 'tofu')`);
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_ZHANG' WHERE pet_id = 'kiwi'`);
  const { rows } = await ctx.pool.query('SELECT pet_id, sticker_key, photo_key FROM pet_match.pets');
  for (const r of rows) {
    for (const s of ['128', '512', '1024']) await store.put(`${r.sticker_key}/${s}.png`, PNG, 'image/png');
    await store.put(r.photo_key, PNG, 'image/jpeg');
  }
});
afterAll(async () => {
  await app.close();
  await ctx.app.close();
  await ctx.pool.end();
});

const get = (url: string) => app.inject({ method: 'GET', url });
const pet = async (id: string) => (await ctx.pool.query('SELECT * FROM pet_match.pets WHERE pet_id = $1', [id])).rows[0];

function result(game: RegisteredGame): ResultPayload {
  return {
    rulesVersion: game.rulesVersion,
    completed: true,
    score: 100,
    clearedCells: 10,
    clearedByMultiplier: [10, 0, 0, 0, 0],
    rushSucceeded: false,
    maxChain: 1,
    toolsFired: 0,
    validMoves: 1,
    actedInLastSeconds: false,
    pets: game.lineup.map((p, i) => ({ id: p.petId, served: i < 2 ? 5 : 0, firstServedSeq: i < 2 ? i + 1 : null })),
  };
}

describe('下架墓碑', () => {
  let lineupGame: RegisteredGame;

  it('预览列出要删的对象、共用原图的宠物、家庭变化与待处理申请，不写入', async () => {
    // 下架前先登记一局，并且读一次图片，让缓存里有这只宠物
    await ctx.pool.query(`UPDATE pet_match.pets SET status = 'unpublished' WHERE pet_id IN ('luna', 'pepper')`);
    lineupGame = (await app.inject({ method: 'POST', url: '/api/games', payload: { playerId: 'U_TEST_BOB', mode: 'normal' } })).json();
    await ctx.pool.query(`UPDATE pet_match.pets SET status = 'published' WHERE pet_id IN ('luna', 'pepper')`);
    expect(lineupGame.lineup.map((p) => p.petId)).toContain('mochi');
    expect((await get('/img/pets/mochi/128')).statusCode).toBe(200);
    expect((await get('/img/silhouettes/mochi/128')).statusCode).toBe(200);
    expect(readdirSync(cacheDir).length).toBeGreaterThan(0);
    await ctx.pool.query(`INSERT INTO pet_match.deletion_requests (player_id, pet_id) VALUES ('U_TEST_ALICE', 'mochi')`);

    const plan = await planUnpublish(ctx.pool, 'mochi');
    // 自己的贴纸与卡背照片，加上共用原图的 tofu 的卡背照片
    expect(plan.objects.sort()).toEqual(['pets/mochi/s1/1024.png', 'pets/mochi/s1/128.png', 'pets/mochi/s1/512.png', 'photos/mochi/shared.jpg', 'photos/tofu/shared.jpg']);
    expect(plan.sharedPhoto).toEqual([{ petId: 'tofu', name: 'Tofu', photoKey: 'photos/tofu/shared.jpg' }]);
    expect(plan.familyDissolves).toEqual([{ petId: 'tofu', name: 'Tofu' }]);
    expect(plan.pendingRequests).toHaveLength(1);
    expect((await pet('mochi')).status).toBe('published');
    expect(store.objects.has('pets/mochi/s1/128.png')).toBe(true);
  });

  it('执行后只留墓碑字段，对象删除；共用原图的宠物去掉卡背照片，家庭只剩一只时解散', async () => {
    await applyUnpublish(ctx.pool, store, await planUnpublish(ctx.pool, 'mochi'));
    const m = await pet('mochi');
    expect(m).toMatchObject({ pet_id: 'mochi', status: 'removed', name: null, owner_user_id: null, family_id: null, species: null, intro: null, owner_quote: null, sticker_key: null, photo_key: null, coat: null });
    expect(m.removed_at).toBeInstanceOf(Date);
    for (const k of ['pets/mochi/s1/128.png', 'pets/mochi/s1/512.png', 'pets/mochi/s1/1024.png', 'photos/mochi/shared.jpg', 'photos/tofu/shared.jpg']) expect(store.objects.has(k)).toBe(false);
    expect(await pet('tofu')).toMatchObject({ status: 'published', name: 'Tofu', photo_key: null, family_id: null });
    expect(store.objects.has('pets/tofu/s1/128.png')).toBe(true);
    // 申请状态不自动改：由 Bob 确认清理完成后用 deletions resolve 标记
    expect((await ctx.pool.query(`SELECT status FROM pet_match.deletion_requests WHERE pet_id = 'mochi'`)).rows[0].status).toBe('pending');
  });

  it('不能重复下架；已经是墓碑的 pet_id 不能再预览', async () => {
    await expect(planUnpublish(ctx.pool, 'mochi')).rejects.toThrow(/already removed/);
  });

  it('图片接口一律 404，并清掉这只宠物的缓存', async () => {
    expect((await get('/img/pets/mochi/128')).statusCode).toBe(404);
    expect((await get('/img/silhouettes/mochi/128')).statusCode).toBe(404);
    expect((await get('/img/photos/tofu?playerId=U_TEST_ALICE')).statusCode).toBe(404);
    const cache = new DiskCache(cacheDir, 1);
    expect(await cache.hasGroup('pet:mochi')).toBe(false);
  });

  it('图鉴、详情、新局与今日店长都不再出现它', async () => {
    const view = (await get('/api/pets?playerId=U_TEST_BOB')).json();
    expect(view.pets.map((p: { petId: string }) => p.petId)).not.toContain('mochi');
    expect(view.total).toBe(7);
    expect((await get('/api/pets/mochi?playerId=U_TEST_BOB')).json()).toMatchObject({ listed: false, name: null, owner: null });
    for (let i = 0; i < 15; i++) {
      const g = (await app.inject({ method: 'POST', url: '/api/games', payload: { playerId: 'U_TEST_BOB', mode: 'normal' } })).json();
      expect(g.lineup.map((p: { petId: string }) => p.petId)).not.toContain('mochi');
      expect(g.families).not.toHaveProperty('tofu');
    }
    await ctx.pool.query(`INSERT INTO pet_match.daily_managers (manager_date, pet_id) VALUES ('2026-12-24', 'mochi')`);
    const m = await dailyManager(ctx.pool, new Date('2026-12-24T03:00:00Z'));
    expect(m?.pet.petId).not.toBe('mochi');
  });

  it('下架前登记的局照常结算，成绩保留；结果里标出已下架的宠物，不把它算作新收集', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/games/${lineupGame.gameId}/result`, payload: { playerId: 'U_TEST_BOB', result: result(lineupGame) } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.score).toBe(100);
    expect(body.removedPetIds).toEqual(['mochi']);
    expect(body.newCollected.map((p: { petId: string }) => p.petId)).not.toContain('mochi');
    // 重试拿到同一份结果，已下架标记按当前目录计算
    const again = await app.inject({ method: 'POST', url: `/api/games/${lineupGame.gameId}/result`, payload: { playerId: 'U_TEST_BOB', result: result(lineupGame) } });
    expect(again.json().removedPetIds).toEqual(['mochi']);
  });
});

describe('publish 遇到墓碑', () => {
  const rec = (pet_id: string, owner: string, original: string | null): PetRecord => ({
    pet_id,
    name: pet_id,
    owner_user_id: owner,
    family_id: null,
    species: null,
    intro: null,
    owner_quote: null,
    sticker: { key: `pets/${pet_id}/x`, files: { '128': '', '512': '', '1024': '' } },
    original,
  });

  it('跳过墓碑宠物；同主只剩一只时不再成家；与墓碑共用原图的宠物不生成卡背照片', () => {
    const pets = [rec('a', 'O1', 'shared.png'), rec('b', 'O1', 'shared.png'), rec('c', 'O1', 'c.png'), rec('d', 'O2', 'd.png'), rec('e', 'O2', 'e.png')];
    const { kept, removed, blockedOriginal } = excludeRemoved(pets, new Set(['a', 'd']));
    expect(removed.map((p) => p.pet_id)).toEqual(['a', 'd']);
    expect(kept.map((p) => [p.pet_id, p.family_id, p.original])).toEqual([
      ['b', 'O1', null],
      ['c', 'O1', 'c.png'],
      ['e', null, 'e.png'],
    ]);
    expect(blockedOriginal).toEqual(['b']);
  });
});
