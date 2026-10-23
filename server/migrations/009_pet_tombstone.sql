-- 阶段 4C：下架墓碑。人工核实删除申请后，宠物记录只保留 pet_id、status = 'removed' 与下架时间，
-- 其余字段清空；历史对局仍可凭 pet_id 识别并过滤。'unpublished' 保留给临时下架（可再上架）。
ALTER TABLE pet_match.pets DROP CONSTRAINT pets_status_check;
ALTER TABLE pet_match.pets ADD CONSTRAINT pets_status_check CHECK (status IN ('published', 'unpublished', 'removed'));
ALTER TABLE pet_match.pets ADD COLUMN removed_at timestamptz;
ALTER TABLE pet_match.pets ALTER COLUMN name DROP NOT NULL;
ALTER TABLE pet_match.pets ADD CONSTRAINT pets_tombstone_check CHECK (status <> 'removed' OR (removed_at IS NOT NULL AND name IS NULL AND owner_user_id IS NULL AND sticker_key IS NULL AND photo_key IS NULL));
