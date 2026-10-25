-- 玩家间永久击掌：同一发送者对同一接收者终身只记一次，普通与鱼关共用。
CREATE TABLE pet_match.player_likes (
  source_player_id text NOT NULL,
  target_player_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_player_id, target_player_id),
  CHECK (source_player_id <> target_player_id)
);
CREATE INDEX player_likes_target_idx ON pet_match.player_likes (target_player_id);
COMMENT ON TABLE pet_match.player_likes IS '玩家间单向永久击掌关系；不可取消，累计数由关系实时计算';

-- 生产以所有者执行迁移；新表只给应用查询与插入权限。
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pet_match_app') THEN
    GRANT SELECT, INSERT ON pet_match.player_likes TO pet_match_app;
    REVOKE UPDATE, DELETE, TRUNCATE ON pet_match.player_likes FROM pet_match_app;
  END IF;
END $$;
