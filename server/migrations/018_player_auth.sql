CREATE TABLE pet_match.player_credentials (
  player_id text PRIMARY KEY,
  pin_hash text,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pet_match.player_sessions (
  token_hash text PRIMARY KEY,
  player_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX player_sessions_player_idx ON pet_match.player_sessions (player_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pet_match_app') THEN
    GRANT SELECT, INSERT, UPDATE ON pet_match.player_credentials, pet_match.player_sessions TO pet_match_app;
  END IF;
END $$;
