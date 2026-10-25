import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.ts';
import { LOCAL_TEST_URL } from '../src/config.ts';
import { appRoleGrants } from '../src/db/appGrants.ts';
import { listMigrations } from '../src/db/migrate.ts';
import { createPool } from '../src/db/pool.ts';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => { ctx = await freshDatabase(); });
afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });

const getLikes = (target = 'U_TEST_ALICE', viewer = 'U_TEST_BOB', query = '') => ctx.app.inject({
  method: 'GET', url: `/api/players/${target}/likes?viewerId=${viewer}${query}`,
});
const like = (target = 'U_TEST_ALICE', playerId = 'U_TEST_BOB', query = '') => ctx.app.inject({
  method: 'POST', url: `/api/players/${target}/likes${query}`, payload: { playerId },
});
const storedLikes = async () => (await ctx.pool.query(
  'SELECT source_player_id, target_player_id, created_at FROM pet_match.player_likes ORDER BY source_player_id, target_player_id',
)).rows;

describe('永久玩家击掌', () => {
  it('有效同事未击掌时返回零次与可击掌状态', async () => {
    const response = await getLikes();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ receivedLikes: 0, likedByViewer: false, canLike: true });
  });

  describe('保存、并发与身份边界', () => {
    beforeEach(async () => { await ctx.pool.query('TRUNCATE pet_match.player_likes'); });

    it('首次保存一次，重复请求与次日请求保持同一条永久关系', async () => {
      const response = await like();
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
      const before = await storedLikes();
      expect(before).toHaveLength(1);
      expect((await like()).json()).toEqual(response.json());
      const tomorrow = buildApp({ pool: ctx.pool, now: () => new Date(Date.now() + 86_400_000) });
      try {
        expect((await tomorrow.inject({ method: 'POST', url: '/api/players/U_TEST_ALICE/likes',
          payload: { playerId: 'U_TEST_BOB' } })).json()).toEqual(response.json());
      } finally { await tomorrow.close(); }
      expect(await storedLikes()).toEqual(before);
    });

    it('同一对玩家同时重试 30 次，每次响应均确认已保存且数据库仅一条', async () => {
      const responses = await Promise.all(Array.from({ length: 30 }, () => like()));
      for (const response of responses) {
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
      }
      expect(await storedLikes()).toHaveLength(1);
    });

    it('两个应用实例和独立连接池并发写入同一关系也仅记一次', async () => {
      const pool = createPool(LOCAL_TEST_URL);
      const app = buildApp({ pool });
      try {
        const responses = await Promise.all(Array.from({ length: 30 }, (_, i) => i % 2 === 0 ? like() : app.inject({
          method: 'POST', url: '/api/players/U_TEST_ALICE/likes', payload: { playerId: 'U_TEST_BOB' },
        })));
        for (const response of responses) {
          expect(response.statusCode).toBe(200);
          expect(response.json()).toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
        }
        expect(await storedLikes()).toHaveLength(1);
        expect((await app.inject('/api/players/U_TEST_ALICE/likes?viewerId=U_TEST_BOB')).json())
          .toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
      } finally { await app.close(); await pool.end(); }
    });

    it('等待另一个事务提交同一关系后，响应读取提交后的新快照', async () => {
      const client = await ctx.pool.connect();
      let pending: ReturnType<typeof like> | undefined;
      try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO pet_match.player_likes(source_player_id,target_player_id)
          VALUES('U_TEST_BOB','U_TEST_ALICE')`);
        pending = like();
        await vi.waitFor(async () => {
          const waiting = await ctx.pool.query(`SELECT count(*)::int AS n FROM pg_stat_activity
            WHERE datname=current_database() AND wait_event_type='Lock'
              AND query LIKE 'INSERT INTO pet_match.player_likes%'`);
          expect(waiting.rows[0].n).toBeGreaterThan(0);
        }, { timeout: 1000, interval: 10 });
        await client.query('COMMIT');
        const response = await pending;
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
        expect(await storedLikes()).toHaveLength(1);
      } finally {
        await client.query('ROLLBACK');
        client.release();
        await pending;
      }
    });

    it('不同发送者各记一次，接收总数与当前查看者是否击掌分别计算', async () => {
      const senders = ['U_TEST_BOB', 'U_TEST_ZHANG', 'U_TEST_SAM'];
      const responses = await Promise.all(senders.map(sender => like('U_TEST_ALICE', sender)));
      expect(responses.every(response => response.statusCode === 200)).toBe(true);
      expect((await getLikes()).json()).toEqual({ receivedLikes: 3, likedByViewer: true, canLike: false });
      expect((await getLikes('U_TEST_ALICE', 'U_TEST_LONG')).json())
        .toEqual({ receivedLikes: 3, likedByViewer: false, canLike: true });
      expect(await storedLikes()).toHaveLength(3);
    });

    it('互相击掌是两个方向独立的永久关系', async () => {
      await like();
      expect((await getLikes('U_TEST_BOB', 'U_TEST_ALICE')).json())
        .toEqual({ receivedLikes: 0, likedByViewer: false, canLike: true });
      const response = await like('U_TEST_BOB', 'U_TEST_ALICE');
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
      expect((await getLikes()).json()).toEqual(response.json());
      expect(await storedLikes()).toHaveLength(2);
    });

    it('查看自己返回累计总数和不可击掌状态，给自己击掌返回 400', async () => {
      await like();
      expect((await getLikes('U_TEST_ALICE', 'U_TEST_ALICE')).json())
        .toEqual({ receivedLikes: 1, likedByViewer: false, canLike: false });
      const response = await like('U_TEST_ALICE', 'U_TEST_ALICE');
      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ error: 'invalid_request' });
      expect(await storedLikes()).toHaveLength(1);
    });

    it.each(['U_NOBODY', 'U_TEST_GONE', 'U_TEST_BOT', 'U_TEST_GUEST'])('未知或停用的目标 %s 不可查看或接收击掌', async target => {
      expect((await getLikes(target)).statusCode).toBe(404);
      expect((await like(target)).statusCode).toBe(404);
      expect(await storedLikes()).toEqual([]);
    });

    it.each(['U_NOBODY', 'U_TEST_GONE', 'U_TEST_BOT', 'U_TEST_GUEST'])('未知或停用的查看者 %s 不可查看或发送击掌', async viewer => {
      expect((await getLikes('U_TEST_ALICE', viewer)).statusCode).toBe(404);
      expect((await like('U_TEST_ALICE', viewer)).statusCode).toBe(404);
      expect(await storedLikes()).toEqual([]);
    });

    it('既有关系保留，发送者或目标停用后拒绝再次访问', async () => {
      await like();
      const before = await storedLikes();
      await ctx.pool.query("UPDATE pet_match.slack_members SET active=false WHERE user_id='U_TEST_BOB'");
      try {
        expect((await getLikes()).statusCode).toBe(404);
        expect((await like()).statusCode).toBe(404);
        expect((await getLikes('U_TEST_BOB', 'U_TEST_ALICE')).statusCode).toBe(404);
        expect((await like('U_TEST_BOB', 'U_TEST_ALICE')).statusCode).toBe(404);
        expect((await getLikes('U_TEST_ALICE', 'U_TEST_LONG')).json().receivedLikes).toBe(1);
        expect(await storedLikes()).toEqual(before);
      } finally {
        await ctx.pool.query("UPDATE pet_match.slack_members SET active=true WHERE user_id='U_TEST_BOB'");
      }
    });

    it('GET 必须带有效字符串 viewerId，POST 必须带且仅带有效字符串 playerId', async () => {
      for (const url of ['/api/players/U_TEST_ALICE/likes', '/api/players/U_TEST_ALICE/likes?viewerId=',
        '/api/players/U_TEST_ALICE/likes?viewerId=U_TEST_BOB&viewerId=U_TEST_SAM']) {
        expect((await ctx.app.inject({ method: 'GET', url })).statusCode).toBe(400);
      }
      for (const payload of [{}, { playerId: '' }, { playerId: 12 }, { playerId: 'U_TEST_BOB', unlike: true }]) {
        expect((await ctx.app.inject({ method: 'POST', url: '/api/players/U_TEST_ALICE/likes', payload })).statusCode).toBe(400);
      }
      expect(await storedLikes()).toEqual([]);
    });

    it('GET 不登记身份、不补发成就、不新增或更新时间', async () => {
      await like();
      const before = await storedLikes();
      const records = async () => (await ctx.pool.query(`SELECT
        (SELECT count(*) FROM pet_match.slack_members) AS members,
        (SELECT count(*) FROM pet_match.player_progress) AS progress,
        (SELECT count(*) FROM pet_match.achievement_awards) AS achievements,
        (SELECT count(*) FROM pet_match.player_titles) AS titles`)).rows;
      const beforeRecords = await records();
      for (let i = 0; i < 3; i++) {
        expect((await getLikes()).json()).toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
        expect((await getLikes('U_TEST_LONG', 'U_TEST_SAM')).json())
          .toEqual({ receivedLikes: 0, likedByViewer: false, canLike: true });
      }
      expect(await storedLikes()).toEqual(before);
      expect(await records()).toEqual(beforeRecords);
    });

    it('没有取消路由，DELETE 与 PATCH 均不改变既有关系', async () => {
      await like();
      const before = await storedLikes();
      for (const method of ['DELETE', 'PATCH'] as const) {
        const response = await ctx.app.inject({ method, url: '/api/players/U_TEST_ALICE/likes', payload: { playerId: 'U_TEST_BOB' } });
        expect(response.statusCode).toBe(404);
      }
      expect(await storedLikes()).toEqual(before);
      expect((await getLikes()).json()).toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
    });

    it('普通与鱼关读取同一关系，切换模式重试不会新增', async () => {
      expect((await like('U_TEST_ALICE', 'U_TEST_BOB', '?mode=normal')).statusCode).toBe(200);
      expect((await getLikes('U_TEST_ALICE', 'U_TEST_BOB', '&mode=normal')).json())
        .toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
      expect((await getLikes('U_TEST_ALICE', 'U_TEST_BOB', '&mode=fish')).json())
        .toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
      expect((await like('U_TEST_ALICE', 'U_TEST_BOB', '?mode=fish')).json())
        .toEqual({ receivedLikes: 1, likedByViewer: true, canLike: false });
      expect(await storedLikes()).toHaveLength(1);
    });

    it('直接 SQL 也不能给自己击掌或重复写同一方向', async () => {
      await expect(ctx.pool.query(`INSERT INTO pet_match.player_likes(source_player_id,target_player_id)
        VALUES('U_TEST_ALICE','U_TEST_ALICE')`)).rejects.toMatchObject({ code: '23514' });
      await like();
      await expect(ctx.pool.query(`INSERT INTO pet_match.player_likes(source_player_id,target_player_id)
        VALUES('U_TEST_BOB','U_TEST_ALICE')`)).rejects.toMatchObject({ code: '23505' });
      expect(await storedLikes()).toHaveLength(1);
    });

    it('应用角色只可查询和插入击掌，不能更新、删除或清空', async () => {
      const client = await ctx.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('CREATE ROLE pet_match_likes_test NOLOGIN');
        for (const grant of appRoleGrants('pet_match_likes_test')) await client.query(grant);
        const privileges = await client.query(`SELECT
          has_table_privilege('pet_match_likes_test','pet_match.player_likes','SELECT') AS read,
          has_table_privilege('pet_match_likes_test','pet_match.player_likes','INSERT') AS insert,
          has_table_privilege('pet_match_likes_test','pet_match.player_likes','UPDATE') AS update,
          has_table_privilege('pet_match_likes_test','pet_match.player_likes','DELETE') AS delete,
          has_table_privilege('pet_match_likes_test','pet_match.player_likes','TRUNCATE') AS truncate`);
        expect(privileges.rows[0]).toEqual({ read: true, insert: true, update: false, delete: false, truncate: false });
        await client.query('SET LOCAL ROLE pet_match_likes_test');
        await client.query(`INSERT INTO pet_match.player_likes(source_player_id,target_player_id)
          VALUES('U_TEST_BOB','U_TEST_ALICE') ON CONFLICT DO NOTHING`);
        expect((await client.query('SELECT count(*)::int AS n FROM pet_match.player_likes')).rows[0].n).toBe(1);
      } finally { await client.query('ROLLBACK'); client.release(); }
    });

    it('标准迁移直接给既有生产应用角色追加查询和插入权限', async () => {
      const client = await ctx.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='pet_match_app') THEN
            CREATE ROLE pet_match_app NOLOGIN;
          END IF;
        END $$`);
        await client.query('DROP TABLE pet_match.player_likes');
        await client.query(listMigrations().find(migration => migration.version === '017_player_likes')!.sql);
        const privileges = await client.query(`SELECT
          has_table_privilege('pet_match_app','pet_match.player_likes','SELECT') AS read,
          has_table_privilege('pet_match_app','pet_match.player_likes','INSERT') AS insert,
          has_table_privilege('pet_match_app','pet_match.player_likes','UPDATE') AS update,
          has_table_privilege('pet_match_app','pet_match.player_likes','DELETE') AS delete,
          has_table_privilege('pet_match_app','pet_match.player_likes','TRUNCATE') AS truncate`);
        expect(privileges.rows[0]).toEqual({ read: true, insert: true, update: false, delete: false, truncate: false });
      } finally { await client.query('ROLLBACK'); client.release(); }
    });
  });
});
