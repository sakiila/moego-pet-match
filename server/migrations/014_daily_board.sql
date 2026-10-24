-- 每日同盘与今日榜：对局记录登记当天的北京自然日，同一天全员同一种子（由日期派生）。
-- 日榜按 board_date 分组、取每人当天最高的已结算分数；总榜仍用 best_scores。
ALTER TABLE pet_match.games
  ADD COLUMN board_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC') + interval '8 hours')::date;
UPDATE pet_match.games SET board_date = ((created_at AT TIME ZONE 'UTC') + interval '8 hours')::date;
CREATE INDEX games_board_date_idx ON pet_match.games (mode, board_date);
