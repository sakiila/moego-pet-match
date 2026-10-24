-- 永久授予与玩家主动佩戴分开：目录变化不收回已获得的称号。
CREATE TABLE pet_match.achievement_awards (
  player_id text NOT NULL,
  achievement_id text NOT NULL CHECK (achievement_id IN ('cats','dogs','friends','species','neighbors','family','album')),
  target_value integer NOT NULL CHECK (target_value > 0),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  source_game_id uuid REFERENCES pet_match.games(game_id),
  PRIMARY KEY (player_id, achievement_id)
);
CREATE TABLE pet_match.player_titles (
  player_id text PRIMARY KEY,
  equipped_title text,
  FOREIGN KEY (player_id, equipped_title) REFERENCES pet_match.achievement_awards(player_id, achievement_id)
);
