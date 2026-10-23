-- 阶段 4B：资料删除申请。提交只记为待处理，由 Bob 人工核实、下架清理后标记已处理；pet_id 为空表示不针对某只宠物的一般申请。
CREATE TABLE pet_match.deletion_requests (
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  pet_id text REFERENCES pet_match.pets (pet_id),
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  result_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX deletion_requests_player_idx ON pet_match.deletion_requests (player_id, created_at DESC);
