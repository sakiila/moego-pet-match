-- 阶段 4A：正式上传。pulled_at 记录 Bob 用命令行取走原文件的时间；按身份与时间统计每日上限。
ALTER TABLE pet_match.submissions ADD COLUMN pulled_at timestamptz;
CREATE INDEX submissions_player_created_idx ON pet_match.submissions (player_id, created_at);
