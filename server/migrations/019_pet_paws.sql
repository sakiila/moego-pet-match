CREATE TABLE pet_match.pet_paws (
  paw_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pet_id text NOT NULL REFERENCES pet_match.pets(pet_id) ON DELETE CASCADE,
  player_id text NOT NULL REFERENCES pet_match.slack_members(user_id) ON DELETE CASCADE,
  message text CHECK (message IN ('cute','pets','play','love')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  owner_seen boolean NOT NULL DEFAULT false,
  reply_owner_id text REFERENCES pet_match.slack_members(user_id) ON DELETE SET NULL,
  replied_at timestamptz,
  ever_replied boolean NOT NULL DEFAULT false,
  reply_seen boolean NOT NULL DEFAULT true,
  UNIQUE (pet_id, player_id)
);
CREATE INDEX pet_paws_pet_order_idx ON pet_match.pet_paws(pet_id, paw_id DESC) WHERE message IS NOT NULL;
CREATE INDEX pet_paws_player_idx ON pet_match.pet_paws(player_id);
CREATE INDEX pet_paws_reply_owner_idx ON pet_match.pet_paws(reply_owner_id) WHERE reply_owner_id IS NOT NULL;
COMMENT ON TABLE pet_match.pet_paws IS '宠物固定短句与主人回爪；message=NULL 为已撤回，保留首次互动状态避免重复提醒';

-- 与留言事务共用宠物级锁，避免正式下架清理和新留言交错。临时下架只隐藏，墓碑清理记录。
CREATE FUNCTION pet_match.clean_pet_paws() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('pet-paw:' || OLD.pet_id, 0));
  IF NEW.status = 'removed' THEN
    DELETE FROM pet_match.pet_paws WHERE pet_id = OLD.pet_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER clean_pet_paws BEFORE UPDATE OF status, owner_user_id ON pet_match.pets
  FOR EACH ROW EXECUTE FUNCTION pet_match.clean_pet_paws();

-- 删除同事资料时清理其回爪内容；其本人留言由外键一并清理。
CREATE FUNCTION pet_match.clean_member_paw_replies() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE pet_match.pet_paws SET reply_owner_id=NULL, replied_at=NULL, reply_seen=true
    WHERE reply_owner_id=OLD.user_id;
  RETURN OLD;
END $$;
CREATE TRIGGER clean_member_paw_replies BEFORE DELETE ON pet_match.slack_members
  FOR EACH ROW EXECUTE FUNCTION pet_match.clean_member_paw_replies();

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='pet_match_app') THEN
    GRANT SELECT, INSERT, UPDATE ON pet_match.pet_paws TO pet_match_app;
    GRANT USAGE, SELECT ON SEQUENCE pet_match.pet_paws_paw_id_seq TO pet_match_app;
  END IF;
END $$;
