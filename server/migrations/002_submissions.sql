-- 用户上传的宠物照片：原文件存 R2 私有桶，这里只记资料与对象键。正式上传界面在阶段 4。
CREATE TABLE pet_match.submissions (
  submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  pet_name text NOT NULL,
  object_key text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);
