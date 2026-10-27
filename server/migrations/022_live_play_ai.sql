-- 正式局服务端执棋与 AI 挑战。只加列与放宽模式约束，不改写已有对局与成绩。
ALTER TABLE pet_match.games DROP CONSTRAINT games_mode_check;
ALTER TABLE pet_match.games ADD CONSTRAINT games_mode_check CHECK (mode IN ('normal', 'fish', 'ai'));
ALTER TABLE pet_match.best_scores DROP CONSTRAINT best_scores_mode_check;
ALTER TABLE pet_match.best_scores ADD CONSTRAINT best_scores_mode_check CHECK (mode IN ('normal', 'fish', 'ai'));

-- live：本局由服务端逐步执棋。refill_key 是每局私密随机数，派生每一步的补落随机状态，从不下发。
-- play_state 为服务端当前棋局，play_moves 为已受理的交换，play_last 供最后一步的网络重试原样返回，
-- pause_ms 为前端因系统洗牌暂停游戏时钟的累计允许量。
ALTER TABLE pet_match.games
  ADD COLUMN live boolean NOT NULL DEFAULT false,
  ADD COLUMN refill_key bytea,
  ADD COLUMN play_state jsonb,
  ADD COLUMN play_moves jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN play_last jsonb,
  ADD COLUMN pause_ms integer NOT NULL DEFAULT 0;
