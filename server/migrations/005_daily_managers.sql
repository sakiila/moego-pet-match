-- 每日店长：北京时间自然日一行，全员同一只；优先尚未当过店长的宠物，原店长下架后当日改选。
CREATE TABLE pet_match.daily_managers (
  manager_date date PRIMARY KEY,
  pet_id text NOT NULL REFERENCES pet_match.pets (pet_id),
  chosen_at timestamptz NOT NULL DEFAULT now()
);
