import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
let latest: string;
beforeAll(async () => {
  ctx = await freshDatabase();
  for (let i = 0; i < 7; i++) {
    const game = await ctx.pool.query(`INSERT INTO pet_match.games(player_id,mode,rules_version,seed,lineup)
      VALUES('U_TEST_ALICE','normal',1,$1,'{}') RETURNING game_id`, [i]);
    latest = game.rows[0].game_id;
    await ctx.pool.query(`INSERT INTO pet_match.game_results(game_id,payload,payload_hash,score,counted,response,created_at)
      VALUES($1,'{}',$2,$3,true,'{}',$4)`, [latest, `profile-${i}`, 1000 + i * 100, new Date(Date.UTC(2026,9,24,8,i))]);
  }
  const fish = await ctx.pool.query(`INSERT INTO pet_match.games(player_id,mode,rules_version,seed,lineup)
    VALUES('U_TEST_ALICE','fish',1,10,'{}') RETURNING game_id`);
  await ctx.pool.query(`INSERT INTO pet_match.game_results(game_id,payload,payload_hash,score,counted,response)
    VALUES($1,'{}','fish-profile',9999,true,'{}')`, [fish.rows[0].game_id]);
  await ctx.pool.query(`INSERT INTO pet_match.games(player_id,mode,rules_version,seed,lineup)
    VALUES('U_TEST_ALICE','normal',1,11,'{}')`);
  await ctx.pool.query(`INSERT INTO pet_match.collections(player_id,pet_id,first_game_id)
    VALUES('U_TEST_ALICE','mochi',$1),('U_TEST_ALICE','tofu',$1)`, [latest]);
  await ctx.pool.query(`INSERT INTO pet_match.achievement_awards(player_id,achievement_id,target_value)
    VALUES('U_TEST_ALICE','cats',5),('U_TEST_ALICE','friends',10)`);
  await ctx.pool.query(`INSERT INTO pet_match.player_titles(player_id,equipped_title) VALUES('U_TEST_ALICE','cats')`);
});
afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });
const get = (path: string) => ctx.app.inject({ method: 'GET', url: path });

describe('公开玩家名片', () => {
  it('只统计已结算的当前模式，最近五局按结算时间倒序，返回当前上架收集数', async () => {
    const res = await get('/api/players/U_TEST_ALICE/profile?mode=normal');
    expect(res.statusCode).toBe(200);
    const view = res.json();
    expect(view).toMatchObject({ userId:'U_TEST_ALICE', name:'Alice Chen', mode:'normal', bestScore:1600, completedGames:7,
      collection:{collected:2,total:6}, equippedTitle:'cats', unlockedTitles:['cats','friends'] });
    expect(view.recentGames.map((g: {score:number}) => g.score)).toEqual([1600,1500,1400,1300,1200]);
    expect(view.recentGames[0]).toMatchObject({gameId:latest,newCollected:2});
    expect(view).not.toHaveProperty('email');
    expect(view).not.toHaveProperty('payload');
  });
  it('鱼关历史独立，不混入普通局', async () => {
    const view = (await get('/api/players/U_TEST_ALICE/profile?mode=fish')).json();
    expect(view).toMatchObject({bestScore:9999,completedGames:1,mode:'fish'});
    expect(view.recentGames).toHaveLength(1);
  });
  it('未开始游玩的同事有明确空状态，读取不补发成就或切换佩戴', async () => {
    const before = await ctx.pool.query('SELECT count(*) FROM pet_match.achievement_awards');
    const view = (await get('/api/players/U_TEST_BOB/profile')).json();
    expect(view).toMatchObject({bestScore:null,completedGames:0,collection:{collected:0,total:6},recentGames:[],unlockedTitles:[],equippedTitle:null});
    expect((await ctx.pool.query('SELECT count(*) FROM pet_match.achievement_awards')).rows).toEqual(before.rows);
    expect((await ctx.pool.query(`SELECT equipped_title FROM pet_match.player_titles WHERE player_id='U_TEST_ALICE'`)).rows[0].equipped_title).toBe('cats');
  });
  it('没有权限展示的身份返回 404，模式参数有校验', async () => {
    expect((await get('/api/players/U_NOT_A_COLLEAGUE/profile')).statusCode).toBe(404);
    expect((await get('/api/players/U_TEST_GONE/profile')).statusCode).toBe(404);
    expect((await get('/api/players/U_TEST_ALICE/profile?mode=bogus')).statusCode).toBe(400);
  });
  it('查看已满足收集门槛但尚未授予徽章的玩家，也不产生补发写入', async () => {
    const game = await ctx.pool.query(`INSERT INTO pet_match.games(player_id,mode,rules_version,seed,lineup)
      VALUES('U_TEST_BOB','normal',1,12,'{}') RETURNING game_id`);
    await ctx.pool.query(`INSERT INTO pet_match.game_results(game_id,payload,payload_hash,score,counted,response)
      VALUES($1,'{}','read-only-profile',0,false,'{}')`, [game.rows[0].game_id]);
    await ctx.pool.query(`INSERT INTO pet_match.collections(player_id,pet_id,first_game_id)
      SELECT 'U_TEST_BOB',pet_id,$1 FROM pet_match.pets WHERE status='published'`, [game.rows[0].game_id]);
    const view = (await get('/api/players/U_TEST_BOB/profile')).json();
    expect(view.collection).toEqual({collected:6,total:6});
    expect(view.unlockedTitles).toEqual([]);
    expect((await ctx.pool.query(`SELECT count(*)::int AS count FROM pet_match.achievement_awards WHERE player_id='U_TEST_BOB'`)).rows[0].count).toBe(0);
  });
  it('下架后不再计入收集统计或单局新增收集数', async () => {
    await ctx.pool.query(`UPDATE pet_match.pets SET status='unpublished' WHERE pet_id='tofu'`);
    try {
      const view = (await get('/api/players/U_TEST_ALICE/profile')).json();
      expect(view.collection).toEqual({collected:1,total:5});
      expect(view.recentGames[0].newCollected).toBe(1);
    } finally { await ctx.pool.query(`UPDATE pet_match.pets SET status='published' WHERE pet_id='tofu'`); }
  });
});
