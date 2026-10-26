-- Slack 线程回复单向同步为只读留言；source_key 为 团队/频道/回复 ts。
ALTER TABLE pet_match.social_comments
  ADD COLUMN source text NOT NULL DEFAULT 'native' CHECK (source IN ('native','slack')),
  ADD COLUMN source_key text UNIQUE;
