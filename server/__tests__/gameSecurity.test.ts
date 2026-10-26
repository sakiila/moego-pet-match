import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDatabase } from './helpers.ts';
import { buildAuthenticatedApp as buildApp } from './helpers.ts';
import type { RegisteredGame } from '../../web/src/api/types.ts';
import { createGame, findHint, getSummary, trySwap } from '../../web/src/engine/game.ts';
import { toResultPayload } from '../../web/src/game/result.ts';
import { productionTurnstile } from '../src/services/turnstile.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
let app: ReturnType<typeof buildApp>;
let time: Date;
const tokens = new Map<string, string>();
const consumed = new Set<string>();
const upstream = vi.fn<typeof fetch>(async (_url, init) => {
  const { response } = JSON.parse(init!.body as string);
  const game = tokens.get(response);
  const success = !!game && !consumed.has(response);
  consumed.add(response);
  return new Response(JSON.stringify({ success, hostname: 'star.baobo.me', action: 'start_game', cdata: game }));
});
const security = { siteKey: 'public', secret: 'test-secret', hostname: 'star.baobo.me', fetchImpl: upstream };
beforeAll(async () => {
  ctx = await freshDatabase();
  app = buildApp({ pool: ctx.pool, gameSecurity: security, now: () => time });
  await app.ready();
});
beforeEach(async () => { time = new Date(); await ctx.pool.query('DELETE FROM pet_match.game_request_limits'); tokens.clear(); consumed.clear(); upstream.mockClear(); });
afterAll(async () => { await app.close(); await ctx.app.close(); await ctx.pool.end(); });
const player = 'U_TEST_BOB';
const credential = () => randomBytes(32).toString('hex');
async function prepare(): Promise<RegisteredGame> {
  const r = await app.inject({ method: 'POST', url: '/api/games', payload: { playerId: player, mode: 'normal' } });
  expect(r.statusCode).toBe(200); return r.json();
}
function payload(game: RegisteredGame, count = 8) {
  let state = createGame({ seed: game.seed, lineup: game.lineup.map(p => p.petId) });
  const moves = [];
  for (let i = 0; i < count; i++) {
    const move = findHint(state)!;
    const at = Math.max(i * 1000, state.busyUntil);
    const next = trySwap(state, move.from, move.to, at);
    if (!next.ok) throw new Error('fixture');
    moves.push({ ...move, at }); state = next.state;
  }
  return { ...toResultPayload(getSummary(state), game.rulesVersion), moves };
}
const start = (game: RegisteredGame, playToken: string, turnstileToken = credential()) => {
  tokens.set(turnstileToken, game.gameId);
  return app.inject({ method: 'POST', url: `/api/games/${game.gameId}/start`, headers: { authorization: `Bearer ${playToken}` }, payload: { playerId: player, turnstileToken } });
};
const submit = (game: RegisteredGame, token: string, result = payload(game), instance = app) =>
  instance.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, headers: { authorization: `Bearer ${token}` }, payload: { playerId: player, result } });

describe('正式对局验证协议', () => {
  it('公开配置不包含 secret；生产缺少或使用测试 key 时拒绝启动', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/game-security' });
    expect(r.json()).toEqual({ enabled: true, siteKey: 'public' });
    expect(r.body).not.toContain(security.secret);
    expect(() => productionTurnstile({})).toThrow();
    expect(() => productionTurnstile({ TURNSTILE_SITE_KEY: '1x00000000000000000000AA', TURNSTILE_SECRET_KEY: 'secret' })).toThrow();
  });
  it('仅准备、缺少证明、未通过 Turnstile 的局不能结算', async () => {
    const game = await prepare();
    expect(game.verificationRequired).toBe(true);
    expect((await submit(game, credential())).statusCode).toBe(422);
    const r = await app.inject({ method: 'POST', url: `/api/games/${game.gameId}/start`, headers: { authorization: `Bearer ${credential()}` }, payload: { playerId: player, turnstileToken: 'fake' } });
    expect(r.statusCode).toBe(403);
    expect(r.json().error).toBe('verification_failed');
  });
  it('正常开局后，必须等真实时长再提交匹配回放', async () => {
    const game = await prepare(); const token = credential();
    expect((await start(game, token)).statusCode).toBe(200);
    expect((await submit(game, token)).json()).toMatchObject({ error: 'invalid', detail: 'too_early' });
    time = new Date(time.getTime() + 90_000);
    const r = await submit(game, token);
    expect(r.statusCode).toBe(200);
    expect(r.json().score).toBe(payload(game).score);
  });
  it('自洽翻倍分数与空回放均不入库', async () => {
    const game = await prepare(); const token = credential(); await start(game, token);
    time = new Date(time.getTime() + 90_000);
    const actual = payload(game);
    const fake = { ...actual, score: actual.score * 2 - (actual.rushSucceeded ? 1000 : 0), clearedCells: actual.clearedCells * 2,
      clearedByMultiplier: actual.clearedByMultiplier.map(n => n * 2), pets: actual.pets.map(p => ({ ...p, served: p.served * 2 })) };
    expect((await submit(game, token, fake)).statusCode).toBe(422);
    expect((await submit(game, token, { ...actual, moves: [] })).statusCode).toBe(422);
    expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.game_results WHERE game_id=$1', [game.gameId])).rows[0].n).toBe(0);
  });
  it('重复开局不改时间、不再次验证 token，错误凭证不能接管', async () => {
    const game = await prepare(); const token = credential(); const response = await start(game, token);
    time = new Date(time.getTime() + 10_000);
    const repeated = await start(game, token);
    expect(repeated.json()).toEqual(response.json());
    expect(upstream).toHaveBeenCalledTimes(1);
    expect((await start(game, credential())).statusCode).toBe(409);
  });
  it('新开局使同一玩家上一未保存局失效，不能跨局复用凭证', async () => {
    const first = await prepare(); const token = credential(); await start(first, token);
    const second = await prepare(); await start(second, credential());
    time = new Date(time.getTime() + 90_000);
    expect((await submit(first, token)).json()).toMatchObject({ detail: 'game_invalidated' });
    expect((await submit(second, token)).json()).toMatchObject({ detail: 'game_proof' });
  });
  it('一次 Turnstile token 不能用于另一个新局', async () => {
    const first = await prepare(); const widget = credential(); await start(first, credential(), widget);
    const second = await prepare();
    expect((await start(second, credential(), widget)).statusCode).toBe(403);
  });
  it('已保存结果跨应用实例重试仍幂等，超时重试不重复加分', async () => {
    const game = await prepare(); const token = credential(); await start(game, token);
    time = new Date(time.getTime() + 90_000);
    const other = buildApp({ pool: ctx.pool, gameSecurity: security, now: () => time });
    try {
      const [a, b] = await Promise.all([submit(game, token), submit(game, token, payload(game), other)]);
      expect(a.statusCode).toBe(200); expect(b.json()).toEqual(a.json());
      time = new Date(time.getTime() + 60 * 60_000);
      expect((await submit(game, token)).json()).toEqual(a.json());
      expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.game_results WHERE game_id=$1', [game.gameId])).rows[0].n).toBe(1);
    } finally { await other.close(); }
  });
  it('未保存的超时局拒绝，旧客户端的未验证局也拒绝', async () => {
    const game = await prepare(); const token = credential(); await start(game, token);
    time = new Date(time.getTime() + 600_001);
    expect((await submit(game, token)).json()).toMatchObject({ detail: 'game_expired' });
    await ctx.pool.query('UPDATE pet_match.games SET requires_verification=false WHERE game_id=$1', [game.gameId]);
    expect((await submit(game, token)).json()).toMatchObject({ detail: 'legacy_game' });
  });
  it('玩家写接口跨应用共享限流，返回 JSON 429 和重试时长', async () => {
    const other = buildApp({ pool: ctx.pool, gameSecurity: security, now: () => time });
    try {
      for (let i = 0; i < 8; i++) {
        const r = await (i % 2 ? app : other).inject({ method: 'POST', url: '/api/games', payload: { playerId: player, mode: 'normal' } });
        expect(r.statusCode).toBe(200);
      }
      const limited = await app.inject({ method: 'POST', url: '/api/games', payload: { playerId: player, mode: 'normal' } });
      expect(limited.statusCode).toBe(429); expect(limited.json()).toEqual({ error: 'rate_limited' });
      expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
      time = new Date(time.getTime() + 60_000);
      expect((await prepare()).verificationRequired).toBe(true);
    } finally { await other.close(); }
  });
});
