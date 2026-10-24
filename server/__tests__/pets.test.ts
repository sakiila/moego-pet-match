import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { beijingDate, dailyManager } from '../src/services/pets.ts';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;

beforeAll(async () => {
  ctx = await freshDatabase();
  await ctx.pool.query(`UPDATE pet_match.pets SET sticker_key = 'k/' || pet_id, intro = 'Intro of ' || name, photo_key = 'photos/' || pet_id || '.jpg'`);
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_ALICE', owner_quote = 'Alice says hi' WHERE pet_id = 'mochi'`);
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_BOB' WHERE pet_id = 'tofu'`);
  const g = await ctx.pool.query(`INSERT INTO pet_match.games (player_id, mode, rules_version, seed, lineup) VALUES ('U_TEST_BOB', 'normal', 1, 1, '{}') RETURNING game_id`);
  await ctx.pool.query(`INSERT INTO pet_match.collections (player_id, pet_id, first_game_id) VALUES ('U_TEST_BOB', 'mochi', $1)`, [g.rows[0].game_id]);
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});

const get = (url: string) => ctx.app.inject({ method: 'GET', url });

describe('图鉴目录', () => {
  it('列出全部上架宠物；主人只对已收集或自家宠物返回', async () => {
    const view = (await get('/api/pets?playerId=U_TEST_BOB')).json();
    expect(view.total).toBe(6);
    expect(view.collected).toBe(1);
    const by = (id: string) => view.pets.find((p: { petId: string }) => p.petId === id);
    expect(by('mochi')).toMatchObject({ collected: true, owner: { userId: 'U_TEST_ALICE', name: 'Alice Chen' } });
    expect(by('tofu')).toMatchObject({ collected: false, own: true, owner: { userId: 'U_TEST_BOB' } });
    expect(by('kiwi')).toMatchObject({ collected: false, owner: null });
  });

  it('贴纸册顺序：先按主人英文名、再按宠物名，没有主人的排最后，只给 petId', async () => {
    const view = (await get('/api/pets?playerId=U_TEST_ZHANG')).json();
    const ownerless = view.pets.filter((p: { petId: string }) => !['mochi', 'tofu'].includes(p.petId)).map((p: { petId: string }) => p.petId);
    expect(view.sheetOrder).toEqual(['mochi', 'tofu', ...ownerless]);
    expect(view.pets.find((p: { petId: string }) => p.petId === 'mochi').owner).toBeNull();
  });

  it('下架宠物不在目录里，也不计入总数', async () => {
    await ctx.pool.query(`UPDATE pet_match.pets SET status = 'unpublished' WHERE pet_id = 'pepper'`);
    expect((await get('/api/pets?playerId=U_TEST_BOB')).json().total).toBe(5);
    await ctx.pool.query(`UPDATE pet_match.pets SET status = 'published' WHERE pet_id = 'pepper'`);
  });
});

describe('宠物详情', () => {
  it('已收集：主人、主人说（owner_quote 优先）与照片', async () => {
    expect((await get('/api/pets/mochi?playerId=U_TEST_BOB')).json()).toMatchObject({
      collected: true,
      owner: { userId: 'U_TEST_ALICE' },
      quote: 'Alice says hi',
      hasPhoto: true,
    });
  });

  it('未收集：只有名字，不泄露主人、介绍或照片', async () => {
    expect((await get('/api/pets/mochi?playerId=U_TEST_ZHANG')).json()).toMatchObject({ collected: false, owner: null, quote: null, hasPhoto: false });
  });

  it('自家宠物即使未收集也能看完整资料（原介绍回退）', async () => {
    expect((await get('/api/pets/tofu?playerId=U_TEST_BOB')).json()).toMatchObject({ own: true, collected: false, quote: 'Intro of Tofu', hasPhoto: true });
  });
});

describe('认识人数', () => {
  it('计已保存收集且仍在名单内的同事，头像取最近收集的 5 位', async () => {
    await ctx.pool.query(`INSERT INTO public."user" (user_id, email, real_name_normalized, team_id) VALUES ('U_TEST_NEW', 'new@moego.pet', 'New Hire', 'T011CF3CMJN')`);
    const g = await ctx.pool.query(`SELECT game_id FROM pet_match.games LIMIT 1`);
    const order = ['U_TEST_BOB', 'U_TEST_ALICE', 'U_TEST_ZHANG', 'U_TEST_SAM', 'U_TEST_LONG', 'U_TEST_NEW', 'U_TEST_GONE'];
    for (const [i, id] of order.entries()) {
      await ctx.pool.query(
        `INSERT INTO pet_match.collections (player_id, pet_id, first_game_id, collected_at) VALUES ($1, 'kiwi', $2, $3)`,
        [id, g.rows[0].game_id, new Date(Date.UTC(2026, 9, 24, 0, i))],
      );
    }
    const { knownBy } = (await get('/api/pets/kiwi?playerId=U_TEST_BOB')).json();
    expect(knownBy.count).toBe(6);
    expect(knownBy.recent.map((x: { userId: string }) => x.userId)).toEqual(['U_TEST_NEW', 'U_TEST_LONG', 'U_TEST_SAM', 'U_TEST_ZHANG', 'U_TEST_ALICE']);
    expect(knownBy.recent[0]).toEqual({ userId: 'U_TEST_NEW', name: 'New Hire' });
  });

  it('他人未收集的宠物不返回', async () => {
    expect((await get('/api/pets/mochi?playerId=U_TEST_ZHANG')).json().knownBy).toBeNull();
  });

  it('自家宠物未收集也返回，尚无人收集时为 0', async () => {
    expect((await get('/api/pets/tofu?playerId=U_TEST_BOB')).json().knownBy).toEqual({ count: 0, recent: [] });
  });
});

describe('每日店长', () => {
  it('同一北京自然日全员同一只；按北京时间切日', async () => {
    const day = new Date('2026-10-23T03:00:00Z');
    const a = await dailyManager(ctx.pool, day, () => 0.1);
    const b = await dailyManager(ctx.pool, day, () => 0.9);
    expect(a).toEqual(b);
    expect(beijingDate(new Date('2026-10-23T15:59:00Z'))).toBe('2026-10-23');
    expect(beijingDate(new Date('2026-10-23T16:00:00Z'))).toBe('2026-10-24');
  });

  it('优先尚未当过店长的宠物：连续 6 天各不相同', async () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 6; d++) {
      const m = await dailyManager(ctx.pool, new Date(`2026-11-0${d}T03:00:00Z`), () => 0.5);
      seen.add(m!.pet.petId);
    }
    expect(seen.size).toBe(6);
  });

  it('当日店长下架后改选其他可用宠物', async () => {
    const day = new Date('2026-12-01T03:00:00Z');
    const first = await dailyManager(ctx.pool, day, () => 0);
    await ctx.pool.query(`UPDATE pet_match.pets SET status = 'unpublished' WHERE pet_id = $1`, [first!.pet.petId]);
    const second = await dailyManager(ctx.pool, day, () => 0);
    expect(second!.pet.petId).not.toBe(first!.pet.petId);
    expect(second!.date).toBe(first!.date);
  });
});
