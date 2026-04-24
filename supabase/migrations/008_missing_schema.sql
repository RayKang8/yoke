-- ============================================================
-- 008_missing_schema.sql
-- Adds share_friends column, devotional_groups junction table,
-- notifications table, fixes visibility constraint, corrects
-- RLS policies to allow group-shared devotional access, adds
-- save_devotional_edit RPC, and adds notification triggers.
-- All statements are idempotent — safe to run on an existing DB.
-- ============================================================

-- ── 1. Add share_friends to devotionals ────────────────────────────────────────
ALTER TABLE devotionals ADD COLUMN IF NOT EXISTS share_friends BOOLEAN DEFAULT TRUE;

-- ── 2. Fix visibility constraint (add 'private', remove obsolete 'group') ──────
ALTER TABLE devotionals DROP CONSTRAINT IF EXISTS devotionals_visibility_check;
ALTER TABLE devotionals ADD CONSTRAINT devotionals_visibility_check
  CHECK (visibility IN ('public', 'friends', 'private'));

-- ── 3. devotional_groups junction table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devotional_groups (
  devotional_id uuid REFERENCES devotionals(id) ON DELETE CASCADE NOT NULL,
  group_id      uuid REFERENCES groups(id)      ON DELETE CASCADE NOT NULL,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (devotional_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_devotional_groups_group      ON devotional_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_devotional_groups_devotional ON devotional_groups(devotional_id);

ALTER TABLE devotional_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "devotional_groups_read"   ON devotional_groups;
DROP POLICY IF EXISTS "devotional_groups_insert" ON devotional_groups;
DROP POLICY IF EXISTS "devotional_groups_delete" ON devotional_groups;

-- Members of a group can see which devotionals are shared there
CREATE POLICY "devotional_groups_read" ON devotional_groups
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT get_my_group_ids()));

-- Authors can share their own devotionals to groups
CREATE POLICY "devotional_groups_insert" ON devotional_groups
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM devotionals d
            WHERE d.id = devotional_id AND d.user_id = auth.uid())
  );

-- Authors can remove their own devotionals from groups
CREATE POLICY "devotional_groups_delete" ON devotional_groups
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM devotionals d
            WHERE d.id = devotional_id AND d.user_id = auth.uid())
  );

-- ── 4. notifications table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id)       ON DELETE CASCADE NOT NULL,
  actor_id      uuid REFERENCES users(id)       ON DELETE CASCADE,
  type          text NOT NULL
                  CHECK (type IN ('friend_request','friend_accepted','reaction','comment')),
  read          boolean DEFAULT FALSE,
  devotional_id uuid REFERENCES devotionals(id) ON DELETE CASCADE,
  friendship_id uuid REFERENCES friendships(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_read"   ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

CREATE POLICY "notifications_read" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 5. Fix devotionals_read to allow access via devotional_groups ───────────────
--
-- The old policy only handled visibility = 'group' (via a now-removed group_id
-- column). Posts shared to groups now use the devotional_groups junction table
-- and carry visibility = 'private' or 'friends'. Without this update, group
-- members cannot see each other's group-only posts.
--
DROP POLICY IF EXISTS "devotionals_read" ON devotionals;

CREATE POLICY "devotionals_read" ON devotionals
  FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.requester_id = auth.uid() AND f.addressee_id = devotionals.user_id)
            OR
            (f.addressee_id = auth.uid() AND f.requester_id = devotionals.user_id)
          )
      )
    )
    OR EXISTS (
      SELECT 1 FROM devotional_groups dg
      WHERE dg.devotional_id = devotionals.id
        AND dg.group_id IN (SELECT get_my_group_ids())
    )
  );

-- ── 6. Fix reactions_read and comments_read to match ───────────────────────────
DROP POLICY IF EXISTS "reactions_read" ON reactions;

CREATE POLICY "reactions_read" ON reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devotionals d
      WHERE d.id = reactions.devotional_id
        AND (
          d.visibility = 'public'
          OR d.user_id = auth.uid()
          OR (
            d.visibility = 'friends'
            AND EXISTS (
              SELECT 1 FROM friendships f
              WHERE f.status = 'accepted'
                AND (
                  (f.requester_id = auth.uid() AND f.addressee_id = d.user_id)
                  OR
                  (f.addressee_id = auth.uid() AND f.requester_id = d.user_id)
                )
            )
          )
          OR EXISTS (
            SELECT 1 FROM devotional_groups dg
            WHERE dg.devotional_id = d.id
              AND dg.group_id IN (SELECT get_my_group_ids())
          )
        )
    )
  );

DROP POLICY IF EXISTS "comments_read" ON comments;

CREATE POLICY "comments_read" ON comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devotionals d
      WHERE d.id = comments.devotional_id
        AND (
          d.visibility = 'public'
          OR d.user_id = auth.uid()
          OR (
            d.visibility = 'friends'
            AND EXISTS (
              SELECT 1 FROM friendships f
              WHERE f.status = 'accepted'
                AND (
                  (f.requester_id = auth.uid() AND f.addressee_id = d.user_id)
                  OR
                  (f.addressee_id = auth.uid() AND f.requester_id = d.user_id)
                )
            )
          )
          OR EXISTS (
            SELECT 1 FROM devotional_groups dg
            WHERE dg.devotional_id = d.id
              AND dg.group_id IN (SELECT get_my_group_ids())
          )
        )
    )
  );

-- ── 7. save_devotional_edit RPC ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION save_devotional_edit(
  p_devotional_id     uuid,
  p_content           text,
  p_visibility        text,
  p_share_friends     boolean,
  p_comments_disabled boolean,
  p_group_ids         uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM devotionals WHERE id = p_devotional_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE devotionals
  SET content           = p_content,
      visibility        = p_visibility,
      share_friends     = p_share_friends,
      comments_disabled = p_comments_disabled
  WHERE id = p_devotional_id;

  DELETE FROM devotional_groups WHERE devotional_id = p_devotional_id;

  IF p_group_ids IS NOT NULL AND array_length(p_group_ids, 1) > 0 THEN
    INSERT INTO devotional_groups (devotional_id, group_id)
    SELECT p_devotional_id, unnest(p_group_ids);
  END IF;
END;
$$;

-- ── 8. Notification triggers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id       uuid,
  p_actor_id      uuid,
  p_type          text,
  p_devotional_id uuid DEFAULT NULL,
  p_friendship_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id = p_actor_id THEN RETURN; END IF;
  INSERT INTO notifications (user_id, actor_id, type, devotional_id, friendship_id)
  VALUES (p_user_id, p_actor_id, p_type, p_devotional_id, p_friendship_id);
END;
$$;

-- Reaction notification
CREATE OR REPLACE FUNCTION trigger_reaction_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM devotionals WHERE id = NEW.devotional_id;
  PERFORM create_notification(v_owner, NEW.user_id, 'reaction', NEW.devotional_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reaction_created ON reactions;
CREATE TRIGGER on_reaction_created
  AFTER INSERT ON reactions
  FOR EACH ROW EXECUTE FUNCTION trigger_reaction_notification();

-- Comment notification
CREATE OR REPLACE FUNCTION trigger_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM devotionals WHERE id = NEW.devotional_id;
  PERFORM create_notification(v_owner, NEW.user_id, 'comment', NEW.devotional_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION trigger_comment_notification();

-- Friendship notification (request sent + accepted)
CREATE OR REPLACE FUNCTION trigger_friendship_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(NEW.addressee_id, NEW.requester_id,
                                'friend_request', NULL, NEW.id);
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status = 'pending'
    AND NEW.status = 'accepted' THEN
    PERFORM create_notification(NEW.requester_id, NEW.addressee_id,
                                'friend_accepted', NULL, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friendship_changed ON friendships;
CREATE TRIGGER on_friendship_changed
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION trigger_friendship_notification();
