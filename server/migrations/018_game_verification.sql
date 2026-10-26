-- 只约束新验证对局，不重写已有成绩。
ALTER TABLE pet_match.games
  ADD COLUMN requires_verification boolean NOT NULL DEFAULT false,
  ADD COLUMN started_at timestamptz,
  ADD COLUMN play_token_hash text,
  ADD COLUMN invalidated_at timestamptz;
CREATE INDEX games_started_player_idx ON pet_match.games (player_id, started_at DESC) WHERE requires_verification;

-- 限流计数由数据库原子更新，应用重启或多实例不能清空计数。
CREATE TABLE pet_match.game_request_limits (
  bucket text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  requests integer NOT NULL
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pet_match_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON pet_match.game_request_limits TO pet_match_app;
  END IF;
END $$;
