import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';
import { inTransaction } from '../src/db/pool.ts';
import { readAchievements, syncAchievements } from '../src/services/achievements.ts';
import { registerGame, settleGame } from '../src/services/games.ts';
import { buildApp } from '../src/app.ts';
import type { ResultPayload } from '../../web/src/api/types.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
let sourceGame: string;
beforeAll(async () => {
  ctx = await freshDatabase();
  await ctx.pool.query("DELETE FROM pet_match.pets");
  for (let i = 0; i < 12; i++) await ctx.pool.query(
    `INSERT INTO pet_match.pets(pet_id,name,status,species,owner_user_id,family_id) VALUES($1,$1,'published',$2,$3,$4)`,
    [`a${i}`, i < 5 ? (i === 0 ? '猫（布偶）' : '猫') : i < 10 ? (i === 5 ? '狗（柯基）' : '狗') : (i === 10 ? '鹦鹉（pineapple conure）' : '鹦鹉'), i < 2 ? 'owner0' : `owner${i}`, i < 2 ? 'family0' : null],
  );
  sourceGame = (await registerGame(ctx.pool, 'U_TEST_BOB', 'normal')).gameId;
});
afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });
async function collect(player: string, ids: string[]) {
  await ctx.pool.query(`INSERT INTO pet_match.collections(player_id,pet_id,first_game_id) SELECT $1,unnest($2::text[]),$3 ON CONFLICT DO NOTHING`, [player, ids, sourceGame]);
}
const profile = (player: string) => inTransaction(ctx.pool, (c) => readAchievements(c, player));

describe('永久收集成就与佩戴', () => {
  it('空记录不解锁；进度只返回汇总，不泄露主人与未收集家庭成员', async () => {
    const view = await profile('U_TEST_BOB');
    expect(view.equippedTitle).toBeNull();
    expect(view.achievements).toHaveLength(7);
    expect(view.achievements.every((a) => a.unlockedAt === null && a.current === 0)).toBe(true);
    expect(JSON.stringify(view)).not.toContain('owner0');
    expect(JSON.stringify(view)).not.toContain('a0');
  });
  it('以独立宠物、不同主人、物种和完整家庭统计；补发后不自动佩戴', async () => {
    await collect('U_TEST_BOB', Array.from({ length: 10 }, (_, i) => `a${i}`));
    const view = await profile('U_TEST_BOB');
    expect(view.achievements.filter((a) => a.unlockedAt).map((a) => a.id)).toEqual(['cats', 'dogs', 'friends', 'family']);
    expect(view.achievements.find((a) => a.id === 'species')?.current).toBe(2);
    expect(view.achievements.find((a) => a.id === 'neighbors')?.current).toBe(9);
    expect(view.equippedTitle).toBeNull();
    await collect('U_TEST_BOB', ['a10', 'a11']);
    expect((await profile('U_TEST_BOB')).achievements.every((a) => a.unlockedAt)).toBe(true);
  });
  it('拒绝佩戴未解锁或不存在的称号；可佩戴与摘下；排行榜同步展示', async () => {
    const url = '/api/players/U_TEST_ALICE/title';
    expect((await ctx.app.inject({ method: 'PATCH', url, payload: { title: 'cats' } })).statusCode).toBe(409);
    expect((await ctx.app.inject({ method: 'PATCH', url, payload: { title: 'missing' } })).statusCode).toBe(400);
    expect((await ctx.app.inject({ method: 'GET', url: '/api/players/NOBODY/achievements' })).statusCode).toBe(404);
    const wearing = await ctx.app.inject({ method: 'PATCH', url: '/api/players/U_TEST_BOB/title', payload: { title: 'cats' } });
    expect(wearing.statusCode).toBe(200);
    expect(wearing.json().equippedTitle).toBe('cats');
    await ctx.pool.query(`INSERT INTO pet_match.best_scores(player_id,mode,score,game_id) VALUES('U_TEST_BOB','normal',100,$1)`, [sourceGame]);
    expect((await ctx.app.inject({ method: 'GET', url: '/api/leaderboard' })).json().entries[0].equippedTitle).toBe('cats');
    expect((await ctx.app.inject({ method: 'PATCH', url: '/api/players/U_TEST_BOB/title', payload: { title: null } })).json().equippedTitle).toBeNull();
  });
  it('新增/下架宠物不收回已获得称号，全收齐保留授予时的目标', async () => {
    await ctx.pool.query("UPDATE pet_match.pets SET status='unpublished' WHERE pet_id='a0'");
    await ctx.pool.query("INSERT INTO pet_match.pets(pet_id,name,status) VALUES('extra','Extra','published')");
    const album = (await profile('U_TEST_BOB')).achievements.find((a) => a.id === 'album')!;
    expect(album.unlockedAt).not.toBeNull();
    expect(album.target).toBe(12);
    expect(album.current).toBe(12);
  });
  it('空目录不误判全收齐', async () => {
    await ctx.pool.query("UPDATE pet_match.pets SET status='unpublished'");
    expect((await profile('U_TEST_ALICE')).achievements.some((a) => a.unlockedAt)).toBe(false);
    await ctx.pool.query("UPDATE pet_match.pets SET status='published' WHERE pet_id <> 'extra'");
  });
  it('每局成功保存时授予新徽章，重试幂等，下一局不重复授予', async () => {
    const game = await registerGame(ctx.pool, 'U_TEST_SAM', 'normal');
    await collect('U_TEST_SAM', ['a0','a1','a2','a3','a4','a5','a6','a7','a8']);
    // 重登记固定阵容，确保本次结算带来第 10 只。
    await ctx.pool.query("UPDATE pet_match.games SET lineup=ARRAY['a9','a0','a1','a2','a3','a4'] WHERE game_id=$1", [game.gameId]);
    const payload: ResultPayload = { rulesVersion: game.rulesVersion, completed: true, score: 30, clearedCells: 3, clearedByMultiplier: [3,0,0,0,0], rushSucceeded: false, maxChain: 1, toolsFired: 0, validMoves: 1, actedInLastSeconds: false, pets: ['a9','a0','a1','a2','a3','a4'].map((id,i) => ({ id, served:i===0?3:0, firstServedSeq:i===0?1:null })) };
    const res = await settleGame(ctx.pool, game.gameId, 'U_TEST_SAM', payload);
    expect(res.newAchievements).toContain('friends');
    expect((await settleGame(ctx.pool, game.gameId, 'U_TEST_SAM', payload)).newAchievements).toEqual(res.newAchievements);
    expect(await inTransaction(ctx.pool, c => syncAchievements(c,'U_TEST_SAM',sourceGame))).toEqual([]);
  });
  it('两个不同对局并发越过同一门槛，只授予一次', async () => {
    const player = 'U_TEST_ZHANG';
    await collect(player, ['a0','a1','a2','a3','a4','a5','a6','a7','a8']);
    await profile(player);
    const games = await Promise.all([registerGame(ctx.pool,player,'normal'),registerGame(ctx.pool,player,'normal')]);
    const ids = ['a9','a0','a1','a2','a3','a4'];
    for (const game of games) await ctx.pool.query('UPDATE pet_match.games SET lineup=$2 WHERE game_id=$1',[game.gameId,ids]);
    const payload: ResultPayload = { rulesVersion:games[0].rulesVersion,completed:true,score:30,clearedCells:3,clearedByMultiplier:[3,0,0,0,0],rushSucceeded:false,maxChain:1,toolsFired:0,validMoves:1,actedInLastSeconds:false,pets:ids.map((id,i)=>({id,served:i===0?3:0,firstServedSeq:i===0?1:null})) };
    const responses = await Promise.all(games.map(game=>settleGame(ctx.pool,game.gameId,player,payload)));
    expect(responses.flatMap(r=>r.newAchievements??[]).filter(id=>id==='friends')).toHaveLength(1);
  });
  it('结算事务失败不留下收集或成就', async () => {
    const game = await registerGame(ctx.pool, 'U_TEST_LONG', 'normal');
    await collect('U_TEST_LONG', ['a0','a1','a2','a3','a4','a5','a6','a7','a8']);
    await profile('U_TEST_LONG');
    await ctx.pool.query("UPDATE pet_match.games SET lineup=ARRAY['a9','a0','a1','a2','a3','a4'] WHERE game_id=$1", [game.gameId]);
    const payload: ResultPayload = { rulesVersion: game.rulesVersion, completed:true, score:30,clearedCells:3,clearedByMultiplier:[3,0,0,0,0],rushSucceeded:false,maxChain:1,toolsFired:0,validMoves:1,actedInLastSeconds:false,pets:['a9','a0','a1','a2','a3','a4'].map((id,i)=>({id,served:i===0?3:0,firstServedSeq:i===0?1:null})) };
    const failing = buildApp({ pool:ctx.pool, settleHooks:{ beforeCommit: async()=>{throw new Error('rollback');} } });
    expect((await failing.inject({method:'POST',url:`/api/games/${game.gameId}/result`,payload:{playerId:'U_TEST_LONG',result:payload}})).statusCode).toBe(503);
    expect((await profile('U_TEST_LONG')).achievements.find(a=>a.id==='friends')?.unlockedAt).toBeNull();
    await failing.close();
  });
});
