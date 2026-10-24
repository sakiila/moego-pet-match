import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RegisteredGame, ResultPayload, SettleResponse } from '../../web/src/api/types.ts';
import { QUIZ_BONUS } from '../src/services/quiz.ts';
import { freshDatabase } from './helpers.ts';

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
const PLAYER = 'U_TEST_BOB';

beforeAll(async () => {
  ctx = await freshDatabase();
  // 占位宠物配上主人：mochi/tofu → Alice，kiwi → Zhang，peanut → Sam，luna/pepper → Bob 本人
  await ctx.pool.query(`UPDATE pet_match.pets SET owner_user_id = CASE pet_id
    WHEN 'mochi' THEN 'U_TEST_ALICE' WHEN 'tofu' THEN 'U_TEST_ALICE' WHEN 'kiwi' THEN 'U_TEST_ZHANG'
    WHEN 'peanut' THEN 'U_TEST_SAM' ELSE 'U_TEST_BOB' END`);
});
afterAll(async () => {
  await ctx.app.close();
  await ctx.pool.end();
});

const LINEUP = ['mochi', 'tofu', 'kiwi', 'peanut', 'luna', 'pepper'];

/** 固定阵容的对局（直接登记，避免随机阵容影响题目选择），再走真实结算接口。 */
async function play(servedIds: string[]): Promise<SettleResponse> {
  const row = await ctx.pool.query(
    `INSERT INTO pet_match.games (player_id, mode, rules_version, seed, lineup) VALUES ($1, 'normal', 1, 1, $2) RETURNING game_id`,
    [PLAYER, LINEUP],
  );
  const game = { gameId: row.rows[0].game_id, rulesVersion: 1, lineup: LINEUP.map((petId) => ({ petId, name: petId })) } as RegisteredGame;
  const pets = game.lineup.map((p, i) => ({ id: p.petId, served: servedIds.includes(p.petId) ? 3 : 0, firstServedSeq: servedIds.includes(p.petId) ? i + 1 : null }));
  const cells = pets.reduce((s, p) => s + p.served, 0);
  const result: ResultPayload = {
    rulesVersion: game.rulesVersion, completed: true, score: cells * 10, clearedCells: cells, clearedByMultiplier: [cells, 0, 0, 0, 0],
    rushSucceeded: false, maxChain: 1, toolsFired: 0, validMoves: 1, actedInLastSeconds: false, pets,
  };
  const res = await ctx.app.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, payload: { playerId: PLAYER, result } });
  expect(res.statusCode, res.body).toBe(200);
  return res.json();
}
const bestScore = async () =>
  (await ctx.pool.query(`SELECT score FROM pet_match.best_scores WHERE player_id = $1 AND mode = 'normal'`, [PLAYER])).rows[0]?.score as number;
const answer = async (quizId: string, choice: string | null, playerId = PLAYER) =>
  ctx.app.inject({ method: 'POST', url: `/api/quizzes/${quizId}/answer`, payload: { playerId, choice } });

describe('猜主人', () => {
  let firstQuiz: NonNullable<SettleResponse['quiz']>;

  it('本局只服务了自家宠物：首局轮到但没有合适题目，顺延', async () => {
    expect((await play(['luna', 'pepper'])).quiz).toBeNull();
  });

  it('顺延到下一局出题：三个选项含正确主人，不含玩家本人', async () => {
    const res = await play(['kiwi']);
    expect(res.quiz).not.toBeNull();
    firstQuiz = res.quiz!;
    expect(firstQuiz.petId).toBe('kiwi');
    const ids = firstQuiz.options.map((o) => o.userId);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids).toContain('U_TEST_ZHANG');
    expect(ids).not.toContain(PLAYER);
  });

  it('距上次出题不满 3 局不再出题，满 3 局可再出', async () => {
    expect((await play(['mochi'])).quiz).toBeNull();
    expect((await play(['mochi'])).quiz).toBeNull();
    expect((await play(['mochi'])).quiz?.petId).toBe('mochi');
  });

  it('作答只记第一次，揭晓真实主人；别人不能替答', async () => {
    expect((await answer(firstQuiz.quizId, 'U_TEST_ZHANG', 'U_TEST_ALICE')).statusCode).toBe(404);
    const wrong = firstQuiz.options.find((o) => o.userId !== 'U_TEST_ZHANG')!.userId;
    expect((await answer(firstQuiz.quizId, wrong)).json()).toMatchObject({
      correct: false, skipped: false, owner: { userId: 'U_TEST_ZHANG', name: 'Zhang Wei(张伟)' }, bonus: 0, score: 30,
    });
    expect((await answer(firstQuiz.quizId, 'U_TEST_ZHANG')).json()).toMatchObject({ correct: false, bonus: 0, score: 30 });
    expect(await bestScore()).toBe(60);
  });

  it('答过的宠物不再出题；跳过不算答过', async () => {
    // kiwi 已答过；再过 3 局只服务 kiwi → 没有合适题目
    await play([]);
    await play([]);
    expect((await play(['kiwi'])).quiz).toBeNull();
    const skipQuiz = (await play(['peanut'])).quiz!;
    expect(skipQuiz.petId).toBe('peanut');
    expect((await answer(skipQuiz.quizId, null)).json()).toMatchObject({ skipped: true, correct: null, bonus: 0 });
  });

  it('答对总分 +100，越过最好成绩即更新排行；重复作答不重复加分；结算重试返回加分后的结果', async () => {
    // 已有最好成绩 60（首局服务 6 格）；再过 3 局出 tofu 题，本局 30 分，答对 → 30 + 100 = 130
    await play([]);
    await play([]);
    const res = await play(['tofu']);
    expect(res.quiz?.petId).toBe('tofu');
    expect(res.personalBest).toEqual({ previous: 60, current: 60, isNew: false });
    const first = (await answer(res.quiz!.quizId, 'U_TEST_ALICE')).json();
    expect(first).toMatchObject({ correct: true, bonus: QUIZ_BONUS, score: 30 + QUIZ_BONUS, personalBest: { previous: 60, current: 130, isNew: true } });
    expect(await bestScore()).toBe(130);
    expect((await answer(res.quiz!.quizId, 'U_TEST_ALICE')).json()).toEqual(first);
    expect(await bestScore()).toBe(130);

    const stored = (await ctx.pool.query('SELECT payload, score, quiz_bonus FROM pet_match.game_results WHERE game_id = $1', [res.gameId])).rows[0];
    expect(stored).toMatchObject({ score: 130, quiz_bonus: QUIZ_BONUS });
    expect(stored.payload.score).toBe(30);
    const retry = await ctx.app.inject({ method: 'POST', url: `/api/games/${res.gameId}/result`, payload: { playerId: PLAYER, result: stored.payload } });
    expect(retry.json()).toMatchObject({ score: 130, personalBest: { previous: 60, current: 130, isNew: true } });
  });

  it('答对但加分后未超过最好成绩：只改本局总分，不动排行', async () => {
    await play([]);
    await play([]);
    const res = await play(['mochi']);
    expect(res.quiz?.petId).toBe('mochi');
    expect((await answer(res.quiz!.quizId, 'U_TEST_ALICE')).json()).toMatchObject({
      correct: true, bonus: QUIZ_BONUS, score: 130, personalBest: { previous: 130, current: 130, isNew: false },
    });
    expect(await bestScore()).toBe(130);
  });

  it('结算重试返回同一道题', async () => {
    const rows = (await ctx.pool.query(`SELECT game_id FROM pet_match.quizzes ORDER BY created_at LIMIT 1`)).rows;
    const stored = (await ctx.pool.query('SELECT payload, response FROM pet_match.game_results WHERE game_id = $1', [rows[0].game_id])).rows[0];
    const retry = await ctx.app.inject({ method: 'POST', url: `/api/games/${rows[0].game_id}/result`, payload: { playerId: PLAYER, result: stored.payload } });
    expect(retry.json().quiz).toEqual(stored.response.quiz);
    expect((await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.quizzes WHERE game_id = $1', [rows[0].game_id])).rows[0].n).toBe(1);
  });
});
