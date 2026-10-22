-- 阶段 2：同事视图、宠物、对局、结算与个人记录。运行于 pet_match schema。

-- 可参与名单：只读现有人员表，按已核验条件过滤，只暴露必要字段
CREATE VIEW pet_match.colleagues AS
SELECT u.user_id, u.real_name_normalized AS name, u.email
FROM public."user" u
WHERE u.deleted = false
  AND u.is_bot = false
  AND (u.team_id = 'T011CF3CMJN' OR u.email ILIKE '%@moego.pet');

CREATE TABLE pet_match.pets (
  pet_id text PRIMARY KEY,
  name text NOT NULL,
  owner_user_id text,
  status text NOT NULL CHECK (status IN ('published', 'unpublished')),
  sticker_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pet_match.games (
  game_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('normal', 'fish')),
  rules_version integer NOT NULL,
  seed integer NOT NULL,
  lineup text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX games_player_idx ON pet_match.games (player_id);

-- 每局至多一份结果；payload_hash 用于识别重复提交，response 保存首次结算返回
CREATE TABLE pet_match.game_results (
  game_id uuid PRIMARY KEY REFERENCES pet_match.games (game_id),
  payload jsonb NOT NULL,
  payload_hash text NOT NULL,
  score integer NOT NULL,
  counted boolean NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pet_match.best_scores (
  player_id text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('normal', 'fish')),
  score integer NOT NULL,
  game_id uuid NOT NULL REFERENCES pet_match.games (game_id),
  achieved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, mode)
);
CREATE INDEX best_scores_rank_idx ON pet_match.best_scores (mode, score DESC);

CREATE TABLE pet_match.collections (
  player_id text NOT NULL,
  pet_id text NOT NULL REFERENCES pet_match.pets (pet_id),
  first_game_id uuid NOT NULL REFERENCES pet_match.games (game_id),
  collected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, pet_id)
);

CREATE TABLE pet_match.player_progress (
  player_id text PRIMARY KEY,
  completed_normal_games integer NOT NULL DEFAULT 0,
  fish_unlocked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
