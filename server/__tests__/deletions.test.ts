import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;

beforeAll(async () => {
  ctx = await freshDatabase();
  await ctx.pool.query(`UPDATE pet_match.pets SET sticker_key = 'k/' || pet_id`);
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_BOB' WHERE pet_id IN ('mochi', 'tofu')`);
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_ALICE' WHERE pet_id = 'kiwi'`);
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = 'U_TEST_BOB', status = 'unpublished' WHERE pet_id = 'pepper'`);
  const g = await ctx.pool.query(`INSERT INTO pet_match.games (player_id, mode, rules_version, seed, lineup) VALUES ('U_TEST_BOB', 'normal', 1, 1, '{}') RETURNING game_id`);
  await ctx.pool.query(`INSERT INTO pet_match.collections (player_id, pet_id, first_game_id) VALUES ('U_TEST_BOB', 'mochi', $1)`, [g.rows[0].game_id]);
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});
beforeEach(async () => {
  await ctx.pool.query('DELETE FROM pet_match.deletion_requests');
});

const get = (url: string) => ctx.app.inject({ method: 'GET', url });
const post = (payload: object) => ctx.app.inject({ method: 'POST', url: '/api/deletion-requests', payload });

describe('我的宠物', () => {
  it('只列本人已上架的宠物，含收集状态与最近一条申请状态', async () => {
    const res = await get('/api/my-pets?playerId=U_TEST_BOB');
    expect(res.statusCode).toBe(200);
    expect(res.json().pets).toEqual([
      { petId: 'mochi', name: 'Mochi', collected: true, request: null },
      { petId: 'tofu', name: 'Tofu', collected: false, request: null },
    ]);
    expect((await get('/api/my-pets?playerId=U_TEST_ZHANG')).json().pets).toEqual([]);
  });

  it('名单外身份 404', async () => {
    expect((await get('/api/my-pets?playerId=U_TEST_GUEST')).statusCode).toBe(404);
  });
});

describe('删除申请', () => {
  it('自家宠物：记为待处理，宠物照常在图鉴与阵容里（不自动下架）', async () => {
    const res = await post({ playerId: 'U_TEST_BOB', petId: 'mochi', note: '  请移除照片  ' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ requestId: expect.any(String), status: 'pending' });
    const row = (await ctx.pool.query('SELECT player_id, pet_id, note, status FROM pet_match.deletion_requests')).rows[0];
    expect(row).toEqual({ player_id: 'U_TEST_BOB', pet_id: 'mochi', note: '请移除照片', status: 'pending' });
    expect((await ctx.pool.query(`SELECT status FROM pet_match.pets WHERE pet_id = 'mochi'`)).rows[0].status).toBe('published');
    const mine = (await get('/api/my-pets?playerId=U_TEST_BOB')).json().pets;
    expect(mine.find((p: { petId: string }) => p.petId === 'mochi').request).toEqual({ status: 'pending' });
  });

  it('不能替别人的宠物、也不能对未上架或不存在的宠物申请', async () => {
    expect((await post({ playerId: 'U_TEST_BOB', petId: 'kiwi' })).statusCode).toBe(403);
    expect((await post({ playerId: 'U_TEST_BOB', petId: 'pepper' })).statusCode).toBe(404);
    expect((await post({ playerId: 'U_TEST_BOB', petId: 'nope' })).statusCode).toBe(404);
    expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.deletion_requests')).rows[0].n).toBe(0);
  });

  it('一般申请不需要宠物；补充说明选填、过长被拒', async () => {
    expect((await post({ playerId: 'U_TEST_ZHANG' })).statusCode).toBe(200);
    expect((await post({ playerId: 'U_TEST_ZHANG', note: 'x'.repeat(1001) })).statusCode).toBe(400);
    expect((await post({ playerId: 'U_TEST_GUEST' })).statusCode).toBe(404);
  });

  it('同一只宠物已有待处理申请时不重复创建，返回原申请', async () => {
    const a = (await post({ playerId: 'U_TEST_BOB', petId: 'tofu' })).json();
    const b = (await post({ playerId: 'U_TEST_BOB', petId: 'tofu', note: '再催一下' })).json();
    expect(b.requestId).toBe(a.requestId);
    expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.deletion_requests')).rows[0].n).toBe(1);
  });

  it('本人的申请列表：宠物名与状态，新的在前；已处理显示已处理', async () => {
    await post({ playerId: 'U_TEST_BOB', petId: 'mochi' });
    await post({ playerId: 'U_TEST_BOB' });
    await ctx.pool.query(`UPDATE pet_match.deletion_requests SET status = 'processed', processed_at = now() WHERE pet_id = 'mochi'`);
    const list = (await get('/api/deletion-requests?playerId=U_TEST_BOB')).json().requests;
    expect(list.map((r: { petName: string | null; status: string }) => [r.petName, r.status])).toEqual([
      [null, 'pending'],
      ['Mochi', 'processed'],
    ]);
    expect((await get('/api/deletion-requests?playerId=U_TEST_ALICE')).json().requests).toEqual([]);
  });
});
