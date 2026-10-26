import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => {
  ctx = await freshDatabase();
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id='U_TEST_ALICE',
    owner_quote='Private quote', photo_key='private/photo.jpg' WHERE pet_id IN ('mochi','tofu','pepper')`);
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id='U_TEST_BOB' WHERE pet_id='kiwi'`);
  await ctx.pool.query(`UPDATE pet_match.pets SET status='unpublished' WHERE pet_id='pepper'`);
  for (const [playerId, petId] of [['U_TEST_BOB', 'mochi'], ['U_TEST_ALICE', 'tofu']]) {
    const game = await ctx.pool.query(`INSERT INTO pet_match.games(player_id,mode,rules_version,seed,lineup)
      VALUES($1,'normal',1,1,'{}') RETURNING game_id`, [playerId]);
    await ctx.pool.query(`INSERT INTO pet_match.collections(player_id,pet_id,first_game_id) VALUES($1,$2,$3)`,
      [playerId, petId, game.rows[0].game_id]);
  }
});
afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });
const get = (path: string) => ctx.app.inject({ method: 'GET', url: path });

describe('玩家名片中的自家宠物', () => {
  it('仅列目标玩家已上架宠物，收集状态属于查看者', async () => {
    const res = await get('/api/players/U_TEST_ALICE/pets?viewerId=U_TEST_BOB');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ pets: [
      { petId: 'mochi', name: 'Mochi', collected: true },
      { petId: 'tofu', name: 'Tofu', collected: false },
    ] });
  });
  it('查看自己的名片仍返回真实收集状态，允许自己查看未收集宠物详情', async () => {
    const res = await get('/api/players/U_TEST_ALICE/pets?viewerId=U_TEST_ALICE');
    expect(res.statusCode).toBe(200);
    expect(res.json().pets.map((pet: { collected: boolean }) => pet.collected)).toEqual([false, true]);
    expect((await get('/api/pets/mochi?playerId=U_TEST_ALICE')).json()).toMatchObject({
      collected: false, own: true, hasPhoto: true, quote: 'Private quote',
    });
  });
  it('没有上架宠物返回空列表，不推断现实中的宠物情况', async () => {
    const res = await get('/api/players/U_TEST_LONG/pets?viewerId=U_TEST_BOB');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ pets: [] });
  });
  it('校验查看者参数与双方名册资格', async () => {
    for (const suffix of ['', '?viewerId=', '?viewerId=%20']) {
      expect((await get(`/api/players/U_TEST_ALICE/pets${suffix}`)).statusCode).toBe(400);
    }
    for (const id of ['U_NOT_A_COLLEAGUE', 'U_TEST_GONE']) {
      expect((await get(`/api/players/${id}/pets?viewerId=U_TEST_BOB`)).statusCode).toBe(404);
      expect((await get(`/api/players/U_TEST_ALICE/pets?viewerId=${id}`)).statusCode).toBe(404);
    }
  });
  it('只揭晓名片上的宠物归属，不开放未收集照片、名言或图鉴主人搜索', async () => {
    expect((await get('/api/players/U_TEST_ALICE/pets?viewerId=U_TEST_BOB')).statusCode).toBe(200);
    expect((await get('/api/pets/tofu?playerId=U_TEST_BOB')).json()).toMatchObject({
      collected: false, own: false, owner: null, quote: null, hasPhoto: false, knownBy: null,
    });
    const collection = (await get('/api/pets?playerId=U_TEST_BOB')).json();
    expect(collection.pets.find((pet: { petId: string }) => pet.petId === 'tofu').owner).toBeNull();
  });
  it('查询不会增加收集、对局、徽章或删除申请', async () => {
    const counts = () => ctx.pool.query(`SELECT
      (SELECT count(*) FROM pet_match.collections) AS collections,
      (SELECT count(*) FROM pet_match.games) AS games,
      (SELECT count(*) FROM pet_match.achievement_awards) AS awards,
      (SELECT count(*) FROM pet_match.deletion_requests) AS requests`);
    const before = (await counts()).rows;
    const response = await get('/api/players/U_TEST_ALICE/pets?viewerId=U_TEST_BOB');
    expect(response.statusCode).toBe(200);
    expect((await counts()).rows).toEqual(before);
    expect(response.body).not.toMatch(/Private quote|photo_key|private\/photo|request|email/);
  });
});
