import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDatabase } from './helpers.ts';
import pg from 'pg';
import { appRoleGrants } from '../src/db/appGrants.ts';
import { buildApp } from '../src/app.ts';
import { LOCAL_TEST_URL } from '../src/config.ts';
import { applyUnpublish, planUnpublish } from '../src/catalog/unpublish.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import type { PawBookView } from '../../web/src/api/types.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
const owner = 'U_TEST_ALICE', visitor = 'U_TEST_BOB';
const book = (who = visitor, pet = 'mochi', cursor = '') => ctx.app.inject(`/api/pets/${pet}/paws?playerId=${who}${cursor}`);
const leave = (message: string | null = 'play', version = 0, who = visitor, pet = 'mochi') => ctx.app.inject({
  method: 'PUT', url: `/api/pets/${pet}/paws`, payload: { playerId: who, message, version },
});
const reply = (id: string, version = 1, who = owner) => ctx.app.inject({
  method: 'POST', url: `/api/pets/mochi/paws/${id}/reply`, payload: { playerId: who, version },
});
const notices = (who = owner) => ctx.app.inject(`/api/players/${who}/paw-notices`);
const read = (ids: string[], kind = 'message', who = owner) => ctx.app.inject({
  method: 'POST', url: '/api/pets/mochi/paws/read', payload: { playerId: who, ids, kind },
});

beforeAll(async () => { ctx = await freshDatabase(); });
afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });
beforeEach(async () => {
  await ctx.pool.query('TRUNCATE pet_match.pet_paws RESTART IDENTITY');
  await ctx.pool.query("UPDATE pet_match.slack_members SET active=true WHERE user_id IN ('U_TEST_BOB','U_TEST_ALICE')");
  await ctx.pool.query("UPDATE pet_match.pets SET status='published',owner_user_id=$1 WHERE pet_id='mochi'", [owner]);
  const game = (await ctx.pool.query(`INSERT INTO pet_match.games(player_id,mode,rules_version,seed,lineup)
    VALUES($1,'normal',1,1,'{}') RETURNING game_id`, [visitor])).rows[0].game_id;
  for (const who of [visitor, 'U_TEST_SAM', 'U_TEST_LONG']) {
    await ctx.pool.query(`INSERT INTO pet_match.collections(player_id,pet_id,first_game_id)
      VALUES($1,'mochi',$2) ON CONFLICT DO NOTHING`, [who, game]);
  }
});

describe('宠物爪印簿', () => {
  it('仅收集者或主人能读取；未收集不泄露内容，主人不必先收集', async () => {
    expect((await book()).json()).toMatchObject({ own: false, count: 0, mine: null, mineVersion: 0 });
    expect((await book(owner)).json()).toMatchObject({ own: true, count: 0 });
    for (const who of ['U_TEST_ZHANG', 'U_TEST_GONE', 'U_NOBODY']) {
      expect((await book(who)).statusCode).toBe(404);
      expect((await leave('play', 0, who)).statusCode).toBe(404);
    }
    expect((await leave('play', 0, owner)).statusCode).toBe(400);
  });
  it('固定语义保存，修改保持同一人数、排序和首次留言时间', async () => {
    const first = (await leave()).json();
    expect(first).toMatchObject({ count: 1, mineVersion: 1, mine: { message: 'play' } });
    const changed = (await leave('pets', 1)).json();
    expect(changed).toMatchObject({ count: 1, mineVersion: 2, mine: { message: 'pets', id: first.mine.id, createdAt: first.mine.createdAt } });
    expect((await notices()).json().messages).toEqual([{ petId: 'mochi', petName: 'Mochi', count: 1 }]);
  });
  it('30 次并发重试只产生一条留言、一个人数和一次未读', async () => {
    const responses = await Promise.all(Array.from({ length: 30 }, () => leave()));
    expect(responses.every(r => r.statusCode === 200 && r.json().count === 1)).toBe(true);
    expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.pet_paws')).rows[0].n).toBe(1);
    expect((await notices()).json().messages[0].count).toBe(1);
  });
  it('过期请求不能覆盖后来的修改；相同内容重试仍成功', async () => {
    await leave(); await leave('love', 1);
    expect((await leave('cute', 1)).statusCode).toBe(409);
    expect((await leave('love', 1)).statusCode).toBe(200);
    expect((await book()).json().mine.message).toBe('love');
  });
  it('只有主人能回爪，并发回爪只保存一次；更换短句保留回应', async () => {
    const id = (await leave()).json().mine.id;
    expect((await reply(id, 1, visitor)).statusCode).toBe(400);
    const responses = await Promise.all(Array.from({ length: 15 }, () => reply(id)));
    expect(responses.every(r => r.statusCode === 200)).toBe(true);
    const mine = (await book()).json().mine;
    expect(mine.reply.owner).toEqual({ userId: owner, name: 'Alice Chen' });
    expect((await notices(visitor)).json().replies).toEqual([{ petId: 'mochi', petName: 'Mochi', count: 1 }]);
    await leave('cute', mine.version);
    expect((await book()).json().mine.reply).toEqual(mine.reply);
  });
  it('首页和簿的 GET 不标已读；只确认本次看见的 ID，不误清新到的留言', async () => {
    const id = (await leave()).json().mine.id;
    await book(owner); await notices();
    expect((await notices()).json().messages[0].count).toBe(1);
    await leave('love', 0, 'U_TEST_SAM');
    expect((await read([id])).statusCode).toBe(200);
    expect((await notices()).json().messages[0].count).toBe(1);
    expect((await read([id], 'message', 'U_TEST_SAM')).statusCode).toBe(400);
    expect((await notices()).json().messages[0].count).toBe(1);
  });
  it('撤回同时移除留言、回应和未读，重留不恢复旧回应、不再提醒', async () => {
    const first = (await leave()).json();
    await reply(first.mine.id);
    const current = (await book()).json();
    const withdrawn = (await leave(null, current.mineVersion)).json();
    expect(withdrawn).toMatchObject({ mine: null, count: 0 });
    expect((await notices()).json()).toEqual({ messages: [], replies: [] });
    expect((await notices(visitor)).json()).toEqual({ messages: [], replies: [] });
    const restored = (await leave('love', withdrawn.mineVersion)).json();
    expect(restored).toMatchObject({ count: 1, mine: { id: first.mine.id, reply: null } });
    expect((await notices()).json().messages).toEqual([]);
    await reply(first.mine.id, restored.mineVersion);
    expect((await notices(visitor)).json().replies).toEqual([]);
  });
  it('回应已撤回的留言不能重新创建回应', async () => {
    const first = (await leave()).json(); await leave(null, 1);
    expect((await reply(first.mine.id)).statusCode).toBe(409);
    expect((await book()).json()).toMatchObject({ mine: null, count: 0 });
  });
  it('停用同事从留言、数量和提醒同时排除', async () => {
    await leave();
    await ctx.pool.query('UPDATE pet_match.slack_members SET active=false WHERE user_id=$1', [visitor]);
    expect((await book(owner)).json()).toMatchObject({ count: 0, entries: [] });
    expect((await notices()).json().messages).toEqual([]);
    expect((await book()).statusCode).toBe(404);
  });
  it('下架立即隐藏簿与提示，正式删除宠物清理互动记录', async () => {
    await leave();
    await ctx.pool.query("UPDATE pet_match.pets SET status='unpublished' WHERE pet_id='mochi'");
    expect((await book()).statusCode).toBe(404);
    expect((await leave()).statusCode).toBe(404);
    expect((await notices()).json().messages).toEqual([]);
    await ctx.pool.query(`UPDATE pet_match.pets SET status='removed', removed_at=now(), name=NULL,
      owner_user_id=NULL,sticker_key=NULL,photo_key=NULL WHERE pet_id='mochi'`);
    expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.pet_paws')).rows[0].n).toBe(0);
    await ctx.pool.query("UPDATE pet_match.pets SET status='published', removed_at=NULL,name='Mochi' WHERE pet_id='mochi'");
  });
  it('参数校验拒绝自由文字、无版本、非法记录 ID 和多余参数', async () => {
    expect((await leave('free comment')).statusCode).toBe(400);
    for (const payload of [{playerId: visitor, message:'cute'}, {playerId:visitor,message:'cute',version:-1},
      {playerId:visitor,message:'cute',version:0,extra:true}]) {
      expect((await ctx.app.inject({method:'PUT',url:'/api/pets/mochi/paws',payload})).statusCode).toBe(400);
    }
    expect((await reply('bad-id')).statusCode).toBe(400);
    expect((await read(['bad-id'])).statusCode).toBe(400);
  });
  it('翻页使用稳定记录游标，新留言插入不会造成旧行重复或漏看', async () => {
    const game=(await ctx.pool.query('SELECT game_id FROM pet_match.games LIMIT 1')).rows[0].game_id;
    await ctx.pool.query(`INSERT INTO pet_match.slack_members(user_id,name)
      SELECT 'PAW_PAGE_'||n,'Page visitor '||n FROM generate_series(1,23) n ON CONFLICT DO NOTHING`);
    await ctx.pool.query(`INSERT INTO pet_match.collections(player_id,pet_id,first_game_id)
      SELECT user_id,'mochi',$1 FROM pet_match.slack_members WHERE user_id LIKE 'PAW_PAGE_%' ON CONFLICT DO NOTHING`,[game]);
    await ctx.pool.query(`INSERT INTO pet_match.pet_paws(pet_id,player_id,message)
      SELECT 'mochi',user_id,'cute' FROM pet_match.slack_members WHERE user_id LIKE 'PAW_PAGE_%'`);
    const first=(await book()).json(); expect(first.entries).toHaveLength(20);
    await leave('pets',0,'U_TEST_SAM');
    const second=(await book(visitor,'mochi',`&cursor=${first.nextCursor}`)).json();
    expect(second.entries).toHaveLength(3); expect(second.nextCursor).toBeNull();
    expect(new Set([...first.entries,...second.entries].map(p=>p.id)).size).toBe(23);
    const old=second.entries.at(-1);
    const replied=await ctx.app.inject({method:'POST',url:`/api/pets/mochi/paws/${old.id}/reply`,
      payload:{playerId:owner,version:old.version,limit:24}});
    expect(replied.statusCode).toBe(200);
    expect(replied.json().entries).toHaveLength(24);
    expect(replied.json<PawBookView>().entries.find(p=>p.id===old.id)?.reply?.owner.userId).toBe(owner);
  });
  it('正式删除同事资料会清理其留言和关联回应', async () => {
    await leave();
    await ctx.pool.query("DELETE FROM pet_match.slack_members WHERE user_id='U_TEST_BOB'");
    try { expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.pet_paws')).rows[0].n).toBe(0); }
    finally { await ctx.pool.query("INSERT INTO pet_match.slack_members(user_id,name,active) VALUES('U_TEST_BOB','Bob',true)"); }
    const sent=(await leave()).json(); await reply(sent.mine.id);
    await ctx.pool.query('DELETE FROM pet_match.slack_members WHERE user_id=$1',[owner]);
    try {
      expect((await book()).json().mine.reply).toBeNull();
      expect((await notices(visitor)).json().replies).toEqual([]);
      const record=(await ctx.pool.query('SELECT reply_owner_id,replied_at FROM pet_match.pet_paws')).rows[0];
      expect(record).toEqual({reply_owner_id:null,replied_at:null});
    } finally { await ctx.pool.query("INSERT INTO pet_match.slack_members(user_id,name,active) VALUES($1,'Alice Chen',true)",[owner]); }
  });
  it('应用的实际最小权限足以留言、回爪和确认已读', async () => {
    const role='pet_match_paw_test';
    await ctx.pool.query(`CREATE ROLE ${role} NOLOGIN`);
    const pool=new pg.Pool({connectionString:LOCAL_TEST_URL,options:`-c role=${role}`});
    const app=buildApp({pool});
    try {
      for (const grant of appRoleGrants(role)) await ctx.pool.query(grant);
      const sent=await app.inject({method:'PUT',url:'/api/pets/mochi/paws',payload:{playerId:visitor,message:'cute',version:0}});
      expect(sent.statusCode).toBe(200);
      const response=await app.inject({method:'POST',url:`/api/pets/mochi/paws/${sent.json().mine.id}/reply`,payload:{playerId:owner,version:1}});
      expect(response.statusCode).toBe(200);
      const ack=await app.inject({method:'POST',url:'/api/pets/mochi/paws/read',payload:{playerId:visitor,kind:'reply',ids:[sent.json().mine.id]}});
      expect(ack.statusCode).toBe(200);
    } finally {
      await app.close(); await pool.end(); await ctx.pool.query(`DROP OWNED BY ${role}`); await ctx.pool.query(`DROP ROLE ${role}`);
    }
  });
  it('正式下架等待正在保存的留言，完成后全部清理且不产生锁顺序死锁', async () => {
    const plan=await planUnpublish(ctx.pool,'mochi');
    const client=await ctx.pool.connect();
    let pending:ReturnType<typeof applyUnpublish>|undefined;
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended('pet-paw:mochi',0))");
      pending=applyUnpublish(ctx.pool,memoryStore(),plan);
      await vi.waitFor(async()=> {
        const waiting=await ctx.pool.query(`SELECT count(*)::int n FROM pg_stat_activity WHERE datname=current_database()
          AND wait_event_type='Lock' AND query LIKE 'SELECT pg_advisory_xact_lock%'`);
        expect(waiting.rows[0].n).toBeGreaterThan(0);
      });
      await client.query("INSERT INTO pet_match.pet_paws(pet_id,player_id,message) VALUES('mochi',$1,'cute')",[visitor]);
      await client.query('COMMIT'); await pending;
      expect((await book()).statusCode).toBe(404);
      expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.pet_paws')).rows[0].n).toBe(0);
    } finally {
      await client.query('ROLLBACK'); client.release(); await pending?.catch(()=>{});
      await ctx.pool.query("UPDATE pet_match.pets SET status='published',name='Mochi',removed_at=NULL WHERE pet_id='mochi'");
    }
  });
});
