import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAuthenticatedApp as buildApp, freshDatabase } from './helpers.ts';
import type { RegisteredGame } from '../../web/src/api/types.ts';
import { createGame, findHint, getSummary, trySwap } from '../../web/src/engine/game.ts';
import { PLAY } from '../../web/src/engine/config.ts';
import type { GameState } from '../../web/src/engine/types.ts';
import { toResultPayload } from '../../web/src/game/result.ts';
import { moveRngState } from '../src/services/livePlay.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
let app: ReturnType<typeof buildApp>;
let time: Date;
const tokens = new Map<string, string>();
const upstream = vi.fn<typeof fetch>(async (_url, init) => {
  const { response } = JSON.parse(init!.body as string);
  return new Response(JSON.stringify({ success: tokens.has(response), hostname: 'star.baobo.me', action: 'start_game', cdata: tokens.get(response) }));
});
const security = { siteKey: 'public', secret: 'test-secret', hostname: 'star.baobo.me', fetchImpl: upstream };
beforeAll(async () => {
  ctx = await freshDatabase();
  app = buildApp({ pool: ctx.pool, gameSecurity: security, now: () => time });
  await app.ready();
});
beforeEach(async () => { time = new Date(); await ctx.pool.query('DELETE FROM pet_match.game_request_limits'); });
afterAll(async () => { await app.close(); await ctx.app.close(); await ctx.pool.end(); });

const player = 'U_TEST_BOB';
const credential = () => randomBytes(32).toString('hex');
const lineupOf = (game: RegisteredGame) => game.lineup.map(p => p.petId);
async function begin(mode: 'normal' | 'fish' = 'normal') {
  const r = await app.inject({ method: 'POST', url: '/api/games', payload: { playerId: player, mode } });
  expect(r.statusCode).toBe(200);
  const game: RegisteredGame = r.json();
  const token = credential(); const widget = credential(); tokens.set(widget, game.gameId);
  const started = await app.inject({ method: 'POST', url: `/api/games/${game.gameId}/start`, headers: { authorization: `Bearer ${token}` }, payload: { playerId: player, turnstileToken: widget } });
  expect(started.statusCode).toBe(200);
  return { game, token, startedAt: time.getTime() };
}
const move = (game: RegisteredGame, token: string, index: number, m: object) =>
  app.inject({ method: 'POST', url: `/api/games/${game.gameId}/moves`, headers: { authorization: `Bearer ${token}` }, payload: { playerId: player, index, move: m } });
const at = (startedAt: number, ms: number) => { time = new Date(startedAt + ms); };

describe('服务端执棋', () => {
  it('正式局登记为 live；补落由服务端私密决定，前端用公开种子推不出来', async () => {
    const { game, token, startedAt } = await begin();
    expect(game).toMatchObject({ live: true, verificationRequired: true });
    let server = createGame({ seed: game.seed, lineup: lineupOf(game) });
    let local = server;
    let differs = false;
    for (let i = 0; i < 6; i++) {
      const m = { ...findHint(server)!, at: Math.max(i * 1000, server.busyUntil) };
      at(startedAt, m.at);
      const r = await move(game, token, i, m);
      expect(r.statusCode).toBe(200);
      const body = r.json() as { state: GameState };
      expect(body.state.rngState).toBe(0);
      expect(r.body).not.toContain('refill_key');
      const guess = trySwap(local, m.from, m.to, m.at);
      if (guess.ok && JSON.stringify(guess.state.board) !== JSON.stringify(body.state.board)) differs = true;
      server = body.state; local = { ...body.state, rngState: game.seed };
    }
    expect(differs).toBe(true);
  });

  it('每步随机状态只由每局私密键与步序决定', () => {
    const key = randomBytes(32);
    expect(moveRngState(key, 3)).toBe(moveRngState(key, 3));
    expect(moveRngState(key, 3)).not.toBe(moveRngState(key, 4));
    expect(moveRngState(randomBytes(32), 3)).not.toBe(moveRngState(key, 3));
  });

  it('走子时刻不能领先真实时间，也不能累计落后超过容差（洗牌暂停按次数放宽）', async () => {
    const { game, token, startedAt } = await begin();
    const first = findHint(createGame({ seed: game.seed, lineup: lineupOf(game) }))!;
    at(startedAt, 1000);
    expect((await move(game, token, 0, { ...first, at: 1000 + PLAY.leadMs + 1 })).json()).toMatchObject({ detail: 'move_ahead' });
    at(startedAt, 1000 + PLAY.lagMs + 1);
    expect((await move(game, token, 0, { ...first, at: 1000 })).json()).toMatchObject({ detail: 'move_late' });
    await ctx.pool.query('UPDATE pet_match.games SET pause_ms = $2 WHERE game_id = $1', [game.gameId, PLAY.shufflePauseMs]);
    expect((await move(game, token, 0, { ...first, at: 1000 })).statusCode).toBe(200);
  });

  it('同一步网络重试原样返回；跳步、错凭证、结算后都拒绝', async () => {
    const { game, token, startedAt } = await begin();
    const state = createGame({ seed: game.seed, lineup: lineupOf(game) });
    const m = { ...findHint(state)!, at: 500 };
    at(startedAt, 600);
    const a = await move(game, token, 0, m);
    const b = await move(game, token, 0, m);
    expect(b.json()).toEqual(a.json());
    expect((await move(game, token, 0, { ...m, at: 501 })).json()).toMatchObject({ detail: 'move_index' });
    expect((await move(game, token, 5, m)).json()).toMatchObject({ detail: 'move_index' });
    expect((await move(game, credential(), 1, m)).json()).toMatchObject({ detail: 'game_proof' });
    const busy = a.json().state as GameState;
    expect((await move(game, token, 1, { ...findHint(busy)!, at: busy.busyUntil - 1 })).json()).toMatchObject({ detail: 'move_rejected' });

    const result = { ...toResultPayload(getSummary(busy), game.rulesVersion), moves: [m] };
    at(startedAt, 95_000);
    const settled = await app.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, headers: { authorization: `Bearer ${token}` }, payload: { playerId: player, result } });
    expect(settled.statusCode).toBe(200);
    expect((await move(game, token, 1, { ...findHint(busy)!, at: 2000 })).json()).toMatchObject({ detail: 'settled' });
  });

  it('结算以服务端棋局为准：用本地公开种子重演的成绩不被接受', async () => {
    const { game, token, startedAt } = await begin();
    let local = createGame({ seed: game.seed, lineup: lineupOf(game) });
    const moves = [];
    for (let i = 0; i < 5; i++) {
      const m = { ...findHint(local)!, at: Math.max(i * 1000, local.busyUntil) };
      at(startedAt, m.at);
      expect((await move(game, token, i, m)).statusCode).toBe(200);
      const next = trySwap(local, m.from, m.to, m.at);
      if (!next.ok) throw new Error('fixture');
      local = next.state; moves.push(m);
    }
    at(startedAt, 95_000);
    const forged = { ...toResultPayload(getSummary(local), game.rulesVersion), moves };
    const r = await app.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, headers: { authorization: `Bearer ${token}` }, payload: { playerId: player, result: forged } });
    expect(r.json()).toMatchObject({ detail: 'replay' });
  });
});

describe('AI 挑战', () => {
  async function aiGame(count = 10) {
    const r = await app.inject({ method: 'POST', url: '/api/games', payload: { playerId: player, mode: 'ai' } });
    expect(r.statusCode).toBe(200);
    const game: RegisteredGame = r.json();
    let state = createGame({ seed: game.seed, lineup: lineupOf(game) });
    const moves = [];
    for (let i = 0; i < count; i++) {
      const m = { ...findHint(state)!, at: Math.max(i * 300, state.busyUntil) };
      const next = trySwap(state, m.from, m.to, m.at);
      if (!next.ok) throw new Error('fixture');
      state = next.state; moves.push(m);
    }
    return { game, result: { ...toResultPayload(getSummary(state), game.rulesVersion), moves } };
  }
  const settle = (game: RegisteredGame, result: object) =>
    app.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, payload: { playerId: player, result } });

  it('不需要人机验证与计时，按公开种子重演走法即可保存，只进 AI 榜', async () => {
    const before = (await app.inject({ method: 'GET', url: `/api/players/${player}` })).json();
    const normalBoard = () => app.inject({ method: 'GET', url: `/api/leaderboard?mode=normal&scope=today&playerId=${player}` }).then(r => r.json());
    const normalBefore = await normalBoard();
    const { game, result } = await aiGame();
    expect(game.mode).toBe('ai');
    expect(game.verificationRequired).toBeUndefined();
    expect(game.live).toBeUndefined();
    expect(game.uncollectedPetIds).toEqual([]);
    const r = await settle(game, result);
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ score: result.score, newCollected: [], newAchievements: [], quiz: null, progress: { counted: false } });

    const ai = (await app.inject({ method: 'GET', url: `/api/leaderboard?mode=ai&scope=today&playerId=${player}` })).json();
    expect(ai.me).toMatchObject({ score: result.score });
    expect(await normalBoard()).toEqual(normalBefore);
    const after = (await app.inject({ method: 'GET', url: `/api/players/${player}` })).json();
    expect(after.best.ai).toBe(result.score);
    expect(after.progress).toEqual(before.progress);
    expect(after.streak).toEqual(before.streak);
    const collected = await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.collections WHERE first_game_id = $1', [game.gameId]);
    expect(collected.rows[0].n).toBe(0);
  });

  it('伪造成绩或缺走法拒绝', async () => {
    const { game, result } = await aiGame();
    expect((await settle(game, { ...result, moves: undefined })).json()).toMatchObject({ detail: 'replay' });
    const doubled = { ...result, score: result.score * 2 - (result.rushSucceeded ? 1000 : 0), clearedCells: result.clearedCells * 2,
      clearedByMultiplier: result.clearedByMultiplier.map(n => n * 2), pets: result.pets.map(p => ({ ...p, served: p.served * 2 })) };
    expect((await settle(game, doubled)).statusCode).toBe(422);
  });

  it('AI 局不能走服务端执棋接口', async () => {
    const { game } = await aiGame(0);
    const r = await move(game, credential(), 0, { from: { r: 0, c: 0 }, to: { r: 0, c: 1 }, at: 0 });
    expect(r.json()).toMatchObject({ detail: 'not_live' });
  });
});
