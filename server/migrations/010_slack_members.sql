-- 实时 Slack 搜索补缺：不在 public."user" 里的在职同事，选中身份时登记到本表。
-- 登记前已按同一套条件过滤（未停用、非机器人、非访客、MoeGo 工作区或 @moego.pet）。
CREATE TABLE pet_match.slack_members (
  user_id text PRIMARY KEY,
  name text NOT NULL,
  email text,
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- 名单 = 现有人员表（原过滤条件）∪ 已登记的 Slack 同事。
-- 人员表里已有该 user_id 的一律以人员表为准（含被它停用的人），登记表只补缺口。
CREATE OR REPLACE VIEW pet_match.colleagues AS
SELECT u.user_id, u.real_name_normalized AS name, u.email
FROM public."user" u
WHERE u.deleted = false
  AND u.is_bot = false
  AND (u.team_id = 'T011CF3CMJN' OR u.email ILIKE '%@moego.pet')
UNION ALL
SELECT m.user_id, m.name, m.email
FROM pet_match.slack_members m
WHERE NOT EXISTS (SELECT 1 FROM public."user" u WHERE u.user_id = m.user_id);
