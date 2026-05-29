-- 020_blocks.sql
-- Mutual user blocking. When A blocks B, neither sees the other's content.

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Users can create and remove their own blocks
CREATE POLICY "users can insert own blocks"
  ON blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "users can delete own blocks"
  ON blocks FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());

-- Both parties can read the block so each side can filter the other out
CREATE POLICY "users can read blocks involving them"
  ON blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());
