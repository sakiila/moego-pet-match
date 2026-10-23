-- 猜主人：出题记录（含当时的完整普通局序号，用于「间隔至少 3 局」）与作答结果。
CREATE TABLE pet_match.quizzes (
  quiz_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  game_id uuid NOT NULL UNIQUE REFERENCES pet_match.games (game_id),
  pet_id text NOT NULL REFERENCES pet_match.pets (pet_id),
  owner_user_id text NOT NULL,
  options text[] NOT NULL,
  at_game_count integer NOT NULL,
  answer_user_id text,
  correct boolean,
  skipped boolean NOT NULL DEFAULT false,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quizzes_player_idx ON pet_match.quizzes (player_id, created_at DESC);
