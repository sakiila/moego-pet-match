-- 猜主人答对奖励：score 为计入排行的本局总分（引擎原始分 payload.score + quiz_bonus）。
ALTER TABLE pet_match.game_results ADD COLUMN quiz_bonus integer NOT NULL DEFAULT 0;
