-- 独立部署：同事名单由 Slack 同步，不再依赖外部人员表。
ALTER TABLE pet_match.slack_members
  ADD COLUMN active boolean NOT NULL DEFAULT true,
  ADD COLUMN synced_at timestamptz;

CREATE OR REPLACE VIEW pet_match.colleagues AS
SELECT user_id::varchar, name::varchar, email::varchar FROM pet_match.slack_members WHERE active;

COMMENT ON SCHEMA pet_match IS 'MoeGo 毛孩子全明星：游戏数据与独立同事名册';
COMMENT ON TABLE pet_match.pets IS '宠物名录、主人关系、图片对象键与上下架状态';
COMMENT ON TABLE pet_match.games IS '对局登记、规则版本、阵容、随机种子与每日棋盘日期';
COMMENT ON TABLE pet_match.game_results IS '对局结算结果与幂等响应';
COMMENT ON TABLE pet_match.best_scores IS '玩家分模式最高成绩与总榜依据';
COMMENT ON TABLE pet_match.collections IS '玩家图鉴收集记录与首次收集对局';
COMMENT ON TABLE pet_match.player_progress IS '有效完整普通局数与鱼关解锁进度';
COMMENT ON TABLE pet_match.submissions IS '宠物上传资料、原文件对象键与处理状态';
COMMENT ON TABLE pet_match.fish_colors IS '鱼关颜色类别、中英文名称与贴纸';
COMMENT ON TABLE pet_match.quizzes IS '猜主人题目、选项与作答结果';
COMMENT ON TABLE pet_match.daily_managers IS '北京时间自然日的每日店长';
COMMENT ON TABLE pet_match.deletion_requests IS '资料删除申请与人工处理结果';
COMMENT ON TABLE pet_match.slack_members IS 'Slack 独立同事名册、有效状态与最近同步时间';
COMMENT ON TABLE pet_match.achievement_awards IS '永久成就与称号授予记录';
COMMENT ON TABLE pet_match.player_titles IS '玩家当前佩戴的已获得称号';
COMMENT ON TABLE pet_match.schema_migrations IS '数据库迁移版本与执行时间';
COMMENT ON VIEW pet_match.colleagues IS '当前可参与游戏的有效 Slack 同事';
