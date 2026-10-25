import { randomInt } from 'node:crypto';
import type pg from 'pg';
import type { QuizQuestion, QuizResult, ResultPayload, SettleResponse } from '../../../web/src/api/types.ts';

/** 两次出题至少间隔的完整普通局数。 */
export const QUIZ_INTERVAL = 3;
/** 答对加到本局总分（并参与最好成绩比较）的分数；答错、跳过不扣分。 */
export const QUIZ_BONUS = 1000;

const shuffle = <T>(items: T[]) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * 结算事务内调用：只对计入的普通完整局。首局起可出题，之后距上次出题满 3 局才可再出；
 * 本局无合适题目则顺延。题目从本局服务过、主人已确认、不是自家、玩家未答过的上架宠物中选；
 * 两个干扰项来自其他上架宠物的已确认主人（排除正确主人与玩家本人）。候选不足则不出题。
 */
export async function maybeCreateQuiz(
  client: pg.PoolClient,
  gameId: string,
  playerId: string,
  completedNormalGames: number,
  payload: ResultPayload,
): Promise<QuizQuestion | null> {
  const last = await client.query('SELECT at_game_count FROM pet_match.quizzes WHERE player_id = $1 ORDER BY created_at DESC LIMIT 1', [playerId]);
  if (last.rows[0] && completedNormalGames - last.rows[0].at_game_count < QUIZ_INTERVAL) return null;

  const served = payload.pets.filter((p) => p.served > 0).map((p) => p.id);
  if (!served.length) return null;
  const eligible = (
    await client.query(
      `SELECT p.pet_id, p.name, p.owner_user_id, c.name AS owner_name
       FROM pet_match.pets p
       JOIN pet_match.colleagues c ON c.user_id = p.owner_user_id
       WHERE p.pet_id = ANY($1) AND p.status = 'published' AND p.owner_user_id <> $2
         AND NOT EXISTS (SELECT 1 FROM pet_match.quizzes q WHERE q.player_id = $2 AND q.pet_id = p.pet_id AND q.answer_user_id IS NOT NULL)`,
      [served, playerId],
    )
  ).rows;
  if (!eligible.length) return null;
  const pet = eligible[randomInt(0, eligible.length)];

  const others = (
    await client.query(
      `SELECT DISTINCT p.owner_user_id AS user_id, c.name
       FROM pet_match.pets p JOIN pet_match.colleagues c ON c.user_id = p.owner_user_id
       WHERE p.status = 'published' AND p.owner_user_id NOT IN ($1, $2)`,
      [pet.owner_user_id, playerId],
    )
  ).rows;
  if (others.length < 2) return null;
  const options = shuffle([{ user_id: pet.owner_user_id, name: pet.owner_name }, ...shuffle(others).slice(0, 2)]);

  const inserted = await client.query(
    `INSERT INTO pet_match.quizzes (player_id, game_id, pet_id, owner_user_id, options, at_game_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING quiz_id`,
    [playerId, gameId, pet.pet_id, pet.owner_user_id, options.map((o) => o.user_id), completedNormalGames],
  );
  return { quizId: inserted.rows[0].quiz_id, petId: pet.pet_id, petName: pet.name, options: options.map((o) => ({ userId: o.user_id, name: o.name })) };
}

/**
 * 作答或跳过；同一题只记录第一次。跳过不算「答过」，该宠物之后仍可能出题。
 * 第一次答对时在同一事务内把奖励加进本局总分与缓存的结算结果，并重新比较个人最好成绩。
 */
export async function answerQuiz(client: pg.PoolClient, quizId: string, playerId: string, choice: string | null): Promise<QuizResult | null> {
  const q = (await client.query('SELECT * FROM pet_match.quizzes WHERE quiz_id = $1 FOR UPDATE', [quizId])).rows[0];
  if (!q || q.player_id !== playerId) return null;
  if (!q.answered_at) {
    if (choice !== null && !q.options.includes(choice)) return null;
    await client.query(
      `UPDATE pet_match.quizzes SET answer_user_id = $2, correct = $3, skipped = $4, answered_at = now() WHERE quiz_id = $1`,
      [quizId, choice, choice === null ? null : choice === q.owner_user_id, choice === null],
    );
    q.answer_user_id = choice;
    q.correct = choice === null ? null : choice === q.owner_user_id;
    q.skipped = choice === null;
    if (q.correct) await addBonus(client, q.game_id, playerId);
  }
  const owner = (await client.query('SELECT name FROM pet_match.colleagues WHERE user_id = $1', [q.owner_user_id])).rows[0];
  const settled = (await client.query('SELECT quiz_bonus, response FROM pet_match.game_results WHERE game_id = $1', [q.game_id])).rows[0];
  const response = settled.response as SettleResponse;
  return {
    correct: q.correct,
    skipped: q.skipped,
    owner: { userId: q.owner_user_id, name: owner?.name ?? '' },
    bonus: settled.quiz_bonus,
    score: response.score,
    personalBest: response.personalBest,
  };
}

/** 本局总分 +QUIZ_BONUS；超过当前最好成绩则更新排行。personalBest 仍以本局之前的最好成绩为参照。 */
async function addBonus(client: pg.PoolClient, gameId: string, playerId: string) {
  const row = (await client.query('SELECT score, response FROM pet_match.game_results WHERE game_id = $1 FOR UPDATE', [gameId])).rows[0];
  const response = row.response as SettleResponse;
  const score: number = row.score + QUIZ_BONUS;
  const { previous } = response.personalBest;
  const isNew = previous === null || score > previous;
  const next: SettleResponse = { ...response, score, personalBest: { previous, current: isNew ? score : previous, isNew } };
  await client.query('UPDATE pet_match.game_results SET score = $2, quiz_bonus = quiz_bonus + $3, response = $4 WHERE game_id = $1', [
    gameId,
    score,
    QUIZ_BONUS,
    next,
  ]);
  await client.query(
    `UPDATE pet_match.best_scores SET score = $3, game_id = $4, achieved_at = now() WHERE player_id = $1 AND mode = $2 AND score < $3`,
    [playerId, 'normal', score, gameId],
  );
}
