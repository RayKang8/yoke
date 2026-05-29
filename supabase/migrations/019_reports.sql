-- 019_reports.sql
-- UGC moderation: users can report devotionals and comments.

CREATE TABLE IF NOT EXISTS reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type text        NOT NULL CHECK (content_type IN ('devotional', 'comment')),
  content_id   uuid        NOT NULL,
  reason       text        NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'other')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE (reporter_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can submit reports but never read them (moderation is admin-side only)
CREATE POLICY "users can insert reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
