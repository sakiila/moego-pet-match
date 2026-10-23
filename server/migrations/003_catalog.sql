-- 阶段 3：真实名录字段与鱼关鱼色。
ALTER TABLE pet_match.pets
  ADD COLUMN family_id text,          -- 同主多宠家庭：主人 user_id（该主人有 ≥2 只上架宠物时）
  ADD COLUMN species text,
  ADD COLUMN intro text,              -- 飞书原介绍（「主人说」回退）
  ADD COLUMN owner_quote text,        -- 主人主动提供的话，优先于原介绍
  ADD COLUMN photo_key text;          -- 处理后照片（图鉴翻面），阶段 3C 写入
CREATE INDEX pets_owner_idx ON pet_match.pets (owner_user_id);
CREATE INDEX pets_family_idx ON pet_match.pets (family_id);

-- Peter 鱼关的六种鱼色：按颜色类别匹配，不使用宠物阵容偏好
CREATE TABLE pet_match.fish_colors (
  color_id text PRIMARY KEY,
  name_zh text NOT NULL,
  name_en text NOT NULL,
  palette_hex text NOT NULL,
  sticker_key text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'unpublished'))
);
