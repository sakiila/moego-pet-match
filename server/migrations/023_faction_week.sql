-- 猫派 vs 狗派周（docs/events/CAT_DOG_WEEK.md）：报名、每局贡献与收官结果。活动日期等常量在 web/src/game/factionWeek.ts。

-- 报名：每期每人一个阵营，不可更换
CREATE TABLE pet_match.faction_members (
  event_id text NOT NULL,
  player_id text NOT NULL,
  faction text NOT NULL CHECK (faction IN ('cat', 'dog')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, player_id)
);

-- 每局贡献：在结算事务中写入，game_id 保证幂等；超出每日封顶的局 counted=false、points=0，保留记录便于核对
CREATE TABLE pet_match.faction_contributions (
  game_id uuid PRIMARY KEY REFERENCES pet_match.games (game_id),
  event_id text NOT NULL,
  player_id text NOT NULL,
  faction text NOT NULL CHECK (faction IN ('cat', 'dog')),
  board_date date NOT NULL,
  own_cells integer NOT NULL,
  other_cells integer NOT NULL,
  points integer NOT NULL,
  counted boolean NOT NULL,
  -- 本局各宠物服务格数 {pet_id: cells}，用于「被服务最多的猫 / 狗」
  pet_cells jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX faction_contributions_event_idx ON pet_match.faction_contributions (event_id, faction, board_date);
CREATE INDEX faction_contributions_player_idx ON pet_match.faction_contributions (event_id, player_id, board_date);

-- 收官结果：每期一行，写入后不再计分
CREATE TABLE pet_match.faction_results (
  event_id text PRIMARY KEY,
  winner text CHECK (winner IN ('cat', 'dog')),   -- NULL 为平局
  result jsonb NOT NULL,
  settled_at timestamptz NOT NULL DEFAULT now()
);

-- 限时传奇徽章：胜方成员在收官时授予。只扩展允许的成就 id。
ALTER TABLE pet_match.achievement_awards DROP CONSTRAINT achievement_awards_achievement_id_check;
ALTER TABLE pet_match.achievement_awards ADD CONSTRAINT achievement_awards_achievement_id_check
  CHECK (achievement_id IN ('cats','dogs','friends','species','neighbors','family','album','hotpot','meowchamp26','woofchamp26'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pet_match_app') THEN
    GRANT SELECT, INSERT, UPDATE ON pet_match.faction_members, pet_match.faction_contributions, pet_match.faction_results TO pet_match_app;
  END IF;
END $$;
