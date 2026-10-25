-- 隐藏称号「火锅搭子」（开发者彩蛋，2026-10-25）：同一局服务到毛肚与菠萝时授予。只扩展允许的成就 id。
ALTER TABLE pet_match.achievement_awards DROP CONSTRAINT achievement_awards_achievement_id_check;
ALTER TABLE pet_match.achievement_awards ADD CONSTRAINT achievement_awards_achievement_id_check
  CHECK (achievement_id IN ('cats','dogs','friends','species','neighbors','family','album','hotpot'));
