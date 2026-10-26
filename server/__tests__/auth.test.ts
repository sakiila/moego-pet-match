import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { freshDatabase } from './helpers.ts';
import { tokenHash, resetPin } from '../src/services/auth.ts';
import { inTransaction } from '../src/db/pool.ts';
import { buildApp } from '../src/app.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => { ctx = await freshDatabase(false); });
beforeEach(async () => { await ctx.pool.query('TRUNCATE pet_match.player_credentials, pet_match.player_sessions'); });
afterAll(async () => { await ctx.app.close(); await ctx.pool.end(); });

const setup = (playerId = 'U_TEST_BOB', pin = '0123', confirmation = pin) => ctx.app.inject({
  method: 'POST', url: '/api/auth/setup', payload: { playerId, pin, confirmation },
});
const login = (pin = '0123', playerId = 'U_TEST_BOB') => ctx.app.inject({
  method: 'POST', url: '/api/auth/login', payload: { playerId, pin },
});
function cookie(response: { headers: Record<string, unknown> }) { return String(response.headers['set-cookie']).split(';')[0]; }

describe('四位密码与登录会话（真实 HTTP 入口，不使用业务测试登录助手）', () => {
  it('首次设置与回访状态分开，前导零可用，接口不返回密码哈希', async () => {
    expect((await ctx.app.inject('/api/auth/players/U_TEST_BOB')).json()).toEqual({ userId: 'U_TEST_BOB', name: 'Bob', hasPin: false });
    const response = await setup();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId: 'U_TEST_BOB' });
    expect(response.headers['set-cookie']).toContain('HttpOnly; SameSite=Strict; Max-Age=2592000');
    expect(response.headers['cache-control']).toBe('no-store');
    expect((await ctx.app.inject('/api/auth/players/U_TEST_BOB')).json().hasPin).toBe(true);
    const credentials = (await ctx.pool.query('SELECT pin_hash FROM pet_match.player_credentials')).rows[0].pin_hash;
    expect(credentials).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
    expect(credentials).not.toBe('0123');
    expect((await login()).statusCode).toBe(200);
  });

  it.each(['123', '12345', 'abcd', '１２３４', '1.23', '12 3', '', 1234])('拒绝非四位 ASCII 数字 %s', async pin => {
    const response = await ctx.app.inject({ method: 'POST', url: '/api/auth/setup', payload: { playerId: 'U_TEST_BOB', pin, confirmation: pin } });
    expect(response.statusCode).toBe(400);
    expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.player_credentials')).rows[0].n).toBe(0);
  });

  it('必须确认密码；已有密码不能被重新设置覆盖', async () => {
    expect((await setup('U_TEST_BOB', '0123', '0124')).statusCode).toBe(400);
    expect((await login()).json().error).toBe('pin_required');
    await setup();
    expect((await setup('U_TEST_BOB', '9999')).json().error).toBe('pin_exists');
    expect((await login()).statusCode).toBe(200);
    expect((await login('9999')).json().error).toBe('wrong_pin');
  });

  it('同一个密码使用独立盐；并发首次设置只成功一次', async () => {
    const results = await Promise.all([setup(), setup('U_TEST_BOB', '9999')]);
    expect(results.map(result => result.statusCode).sort()).toEqual([200, 409]);
    const winner = results[0].statusCode === 200 ? '0123' : '9999';
    expect((await login(winner)).statusCode).toBe(200);
    await setup('U_TEST_ALICE', winner);
    const { rows } = await ctx.pool.query('SELECT pin_hash FROM pet_match.player_credentials');
    expect(new Set(rows.map(row => row.pin_hash)).size).toBe(2);
  });

  it('五次输错锁定 15 分钟，锁定不能被正确密码或重新设置绕过；到期可恢复', async () => {
    await setup();
    const attempts = await Promise.all(Array.from({ length: 7 }, () => login('9999')));
    expect(attempts.filter(result => result.statusCode === 401)).toHaveLength(4);
    expect(attempts.filter(result => result.statusCode === 429)).toHaveLength(3);
    const blocked = await login();
    expect(blocked.statusCode).toBe(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(890);
    expect((await setup()).statusCode).toBe(429);
    await ctx.pool.query("UPDATE pet_match.player_credentials SET locked_until=now()-interval '1 second'");
    expect((await login()).statusCode).toBe(200);
    expect((await ctx.pool.query('SELECT failed_attempts,locked_until FROM pet_match.player_credentials')).rows[0]).toEqual({ failed_attempts: 0, locked_until: null });
  });

  it('刷新可用同一会话；退出立即撤销，伪造和过期凭证不可用', async () => {
    const response = await setup();
    const headers = { cookie: cookie(response) };
    const get = () => ctx.app.inject({ url: '/api/players/U_TEST_BOB', headers });
    expect((await get()).statusCode).toBe(200);
    const token = headers.cookie.split('=')[1];
    expect((await ctx.pool.query('SELECT token_hash FROM pet_match.player_sessions')).rows[0].token_hash).toBe(tokenHash(token));
    await ctx.pool.query("UPDATE pet_match.player_sessions SET expires_at=now()-interval '1 second'");
    expect((await get()).statusCode).toBe(401);
    const fresh = await login();
    const freshHeaders = { cookie: cookie(fresh) };
    expect((await ctx.app.inject({ method: 'POST', url: '/api/auth/logout', headers: freshHeaders })).headers['set-cookie']).toContain('Max-Age=0');
    expect((await ctx.app.inject({ url: '/api/players/U_TEST_BOB', headers: freshHeaders })).statusCode).toBe(401);
    expect((await ctx.app.inject({ url: '/api/players/U_TEST_BOB', headers: { cookie: `pet_match_session=${'a'.repeat(64)}` } })).statusCode).toBe(401);
  });

  it('所有个人资料与写入口要求登录；不能修改 playerId 或 viewerId 冒用他人', async () => {
    const protectedRequests = [
      { url: '/api/players/U_TEST_BOB' },
      { url: '/api/players/U_TEST_BOB/achievements' },
      { url: '/api/pets?playerId=U_TEST_BOB' },
      { url: '/api/pets/mochi?playerId=U_TEST_BOB' },
      { url: '/api/my-pets?playerId=U_TEST_BOB' },
      { url: '/api/deletion-requests?playerId=U_TEST_BOB' },
      { url: '/api/players/U_TEST_ALICE/pets?viewerId=U_TEST_BOB' },
      { url: '/api/players/U_TEST_ALICE/likes?viewerId=U_TEST_BOB' },
      { method: 'POST' as const, url: '/api/games', payload: { playerId: 'U_TEST_BOB', mode: 'normal' } },
      { method: 'POST' as const, url: '/api/players/U_TEST_ALICE/likes', payload: { playerId: 'U_TEST_BOB' } },
      { method: 'PATCH' as const, url: '/api/players/U_TEST_BOB/title', payload: { title: null } },
      { method: 'POST' as const, url: '/api/deletion-requests', payload: { playerId: 'U_TEST_BOB' } },
    ];
    const alice = { cookie: cookie(await setup('U_TEST_ALICE')) };
    for (const request of protectedRequests) {
      expect((await ctx.app.inject(request)).statusCode, request.url).toBe(401);
      expect((await ctx.app.inject({ ...request, headers: alice })).statusCode, request.url).toBe(403);
    }
    const bob = { cookie: cookie(await setup()) };
    const game = (await ctx.app.inject({ method: 'POST', url: '/api/games', payload: { playerId: 'U_TEST_BOB', mode: 'normal' }, headers: bob })).json();
    const result = { rulesVersion: game.rulesVersion, completed: true, score: 0, clearedCells: 0, clearedByMultiplier: [0,0,0,0,0], rushSucceeded: false,
      maxChain: 0, toolsFired: 0, validMoves: 0, actedInLastSeconds: false, pets: game.lineup.map((pet: {petId:string}) => ({ id: pet.petId, served: 0, firstServedSeq: null })) };
    for (const request of [
      { method: 'POST' as const, url: `/api/games/${game.gameId}/result`, payload: { playerId: 'U_TEST_BOB', result } },
      { method: 'POST' as const, url: '/api/quizzes/00000000-0000-4000-8000-000000000000/answer', payload: { playerId: 'U_TEST_BOB', choice: null } },
    ]) {
      expect((await ctx.app.inject(request)).statusCode).toBe(401);
      expect((await ctx.app.inject({ ...request, headers: alice })).statusCode).toBe(403);
    }
    expect((await ctx.app.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, payload: { playerId: 'U_TEST_BOB', result }, headers: bob })).statusCode).toBe(200);
  });

  it('手工重置撤销所有设备登录并保留成绩；停用同事不能登录', async () => {
    const bob = { cookie: cookie(await setup()) };
    const second = { cookie: cookie(await login()) };
    await ctx.pool.query("WITH game AS (INSERT INTO pet_match.games(player_id,mode,seed,rules_version,lineup) VALUES('U_TEST_BOB','normal',1,1,'{}') RETURNING game_id) INSERT INTO pet_match.best_scores(player_id,mode,score,game_id) SELECT 'U_TEST_BOB','normal',1234,game_id FROM game ON CONFLICT(player_id,mode) DO UPDATE SET score=1234");
    await ctx.pool.query("INSERT INTO pet_match.collections(player_id,pet_id,first_game_id) SELECT 'U_TEST_BOB','mochi',game_id FROM pet_match.best_scores WHERE player_id='U_TEST_BOB' AND mode='normal' ON CONFLICT DO NOTHING");
    await inTransaction(ctx.pool, client => resetPin(client, 'U_TEST_BOB'));
    for (const headers of [bob, second]) expect((await ctx.app.inject({ url: '/api/players/U_TEST_BOB', headers })).statusCode).toBe(401);
    expect((await ctx.pool.query("SELECT score FROM pet_match.best_scores WHERE player_id='U_TEST_BOB'")).rows[0].score).toBe(1234);
    expect((await ctx.pool.query("SELECT pet_id FROM pet_match.collections WHERE player_id='U_TEST_BOB' AND pet_id='mochi'")).rowCount).toBe(1);
    expect((await ctx.app.inject('/api/auth/players/U_TEST_BOB')).json().hasPin).toBe(false);
    expect((await setup('U_TEST_BOB', '5678')).statusCode).toBe(200);
    expect((await setup('U_TEST_GONE')).statusCode).toBe(404);
    expect((await ctx.app.inject('/api/auth/players/U_TEST_GONE')).statusCode).toBe(404);
  });

  it('上传与卡背照片不能使用未登录或其他玩家的身份', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pin-auth-'));
    const app = buildApp({ pool: ctx.pool, images: { cache: new DiskCache(dir, 1_000_000), store: memoryStore(), fetchAvatar: async () => null } });
    try {
      const alice = { cookie: cookie(await setup('U_TEST_ALICE')) };
      for (const headers of [{}, alice]) {
        const expected = 'cookie' in headers ? 403 : 401;
        expect((await app.inject({ url: '/img/photos/mochi?playerId=U_TEST_BOB', headers })).statusCode).toBe(expected);
        const boundary = 'pin-auth-test';
        const payload = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="playerId"\r\n\r\nU_TEST_BOB\r\n--${boundary}\r\nContent-Disposition: form-data; name="petName"\r\n\r\nMochi\r\n--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="test.png"\r\nContent-Type: image/png\r\n\r\nimage\r\n--${boundary}--\r\n`);
        expect((await app.inject({ method: 'POST', url: '/api/submissions', payload, headers: { ...headers, 'content-type': `multipart/form-data; boundary=${boundary}` } })).statusCode).toBe(expected);
      }
    } finally {
      await app.close();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('生产 Cookie 启用 Secure；名册停用会立即阻止原有登录', async () => {
    const previous = process.env.NODE_ENV;
    let response;
    try {
      process.env.NODE_ENV = 'production';
      response = await setup();
    } finally { process.env.NODE_ENV = previous; }
    expect(response.headers['set-cookie']).toContain('; Secure');
    try {
      await ctx.pool.query("UPDATE pet_match.slack_members SET active=false WHERE user_id='U_TEST_BOB'");
      expect((await ctx.app.inject({ url: '/api/players/U_TEST_BOB', headers: { cookie: cookie(response) } })).statusCode).toBe(404);
      expect((await login()).statusCode).toBe(404);
    } finally { await ctx.pool.query("UPDATE pet_match.slack_members SET active=true WHERE user_id='U_TEST_BOB'"); }
  });
});
