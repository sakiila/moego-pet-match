CREATE TABLE pet_match.social_posts (
  id uuid PRIMARY KEY,
  author_id text NOT NULL,
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
  pet_id text REFERENCES pet_match.pets(pet_id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('native','slack')),
  source_key text UNIQUE,
  source_channel text,
  source_ts text,
  source_version numeric(24,6) NOT NULL DEFAULT 0,
  source_hash text,
  source_url text,
  payload_hash text,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now(),
  hidden_at timestamptz,
  deleted_at timestamptz,
  excluded_at timestamptz,
  source_checked_at timestamptz,
  CHECK ((source='slack') = (source_key IS NOT NULL))
);
CREATE INDEX social_posts_feed_idx ON pet_match.social_posts(created_at DESC,id DESC) WHERE hidden_at IS NULL AND deleted_at IS NULL;
CREATE INDEX social_posts_author_idx ON pet_match.social_posts(author_id,source,created_at DESC,id DESC) WHERE hidden_at IS NULL AND deleted_at IS NULL;
CREATE INDEX social_posts_source_idx ON pet_match.social_posts(source_channel,created_at) WHERE source='slack' AND deleted_at IS NULL;
CREATE INDEX social_posts_verify_idx ON pet_match.social_posts(source_checked_at) WHERE source='slack' AND hidden_at IS NULL AND deleted_at IS NULL;

CREATE TABLE pet_match.social_media (
  id uuid PRIMARY KEY,
  post_id uuid REFERENCES pet_match.social_posts(id),
  uploader_id text NOT NULL,
  object_key text NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 8),
  width integer NOT NULL,
  height integer NOT NULL,
  bytes integer NOT NULL,
  source_file_id text,
  ready boolean NOT NULL DEFAULT false,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  purged_at timestamptz,
  purge_claimed_until timestamptz
);
CREATE INDEX social_media_post_idx ON pet_match.social_media(post_id,position) WHERE deleted_at IS NULL;
CREATE INDEX social_media_source_idx ON pet_match.social_media(source_file_id) WHERE source_file_id IS NOT NULL;
CREATE INDEX social_media_gc_idx ON pet_match.social_media(created_at) WHERE purged_at IS NULL;

CREATE TABLE pet_match.social_comments (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES pet_match.social_posts(id),
  author_id text NOT NULL,
  body text NOT NULL CHECK (char_length(body) <= 500),
  reply_to_user_id text,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX social_comments_post_idx ON pet_match.social_comments(post_id,created_at DESC,id DESC) WHERE deleted_at IS NULL;

CREATE TABLE pet_match.social_reactions (
  post_id uuid NOT NULL REFERENCES pet_match.social_posts(id),
  player_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('cute','pets','play','love')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id,player_id,kind)
);
CREATE INDEX social_reactions_counts_idx ON pet_match.social_reactions(post_id,kind) WHERE active;

CREATE TABLE pet_match.social_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  post_id uuid NOT NULL REFERENCES pet_match.social_posts(id),
  comment_id uuid REFERENCES pet_match.social_comments(id),
  recipient_id text NOT NULL,
  actor_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('cute','pets','play','love','comment')),
  excerpt text,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  read_at timestamptz,
  deleted_at timestamptz,
  CHECK (recipient_id <> actor_id)
);
CREATE INDEX social_notices_recipient_idx ON pet_match.social_notices(recipient_id,created_at DESC,id DESC) WHERE deleted_at IS NULL;
CREATE INDEX social_notices_post_idx ON pet_match.social_notices(post_id);
CREATE INDEX social_notices_comment_idx ON pet_match.social_notices(comment_id) WHERE comment_id IS NOT NULL;

CREATE TABLE pet_match.social_reports (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES pet_match.social_posts(id),
  reporter_id text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz(3) NOT NULL DEFAULT now()
);

-- 队列只保存定位信息，不重复保存频道正文、照片地址或令牌。
CREATE TABLE pet_match.social_slack_jobs (
  event_id text PRIMARY KEY,
  event jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  claimed_until timestamptz,
  claim_token uuid,
  done_at timestamptz,
  failed_at timestamptz,
  last_error text
);
CREATE INDEX social_slack_jobs_pending_idx ON pet_match.social_slack_jobs(available_at) WHERE done_at IS NULL AND failed_at IS NULL;
CREATE TABLE pet_match.social_deleted_files (file_id text PRIMARY KEY, deleted_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE pet_match.social_sync_state (
  source_key text PRIMARY KEY,
  next_poll_at timestamptz NOT NULL DEFAULT now(),
  claimed_until timestamptz,
  last_poll_at timestamptz,
  last_error text
);

DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='pet_match_app') THEN
    GRANT SELECT,INSERT,UPDATE ON pet_match.social_posts,pet_match.social_media,pet_match.social_comments,
      pet_match.social_reactions,pet_match.social_notices,pet_match.social_reports,pet_match.social_slack_jobs,
      pet_match.social_deleted_files,pet_match.social_sync_state TO pet_match_app;
  END IF;
END $$;
