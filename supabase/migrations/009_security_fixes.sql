-- ============================================================
-- 009_security_fixes.sql
-- Security hardening:
--   1. Lock notifications_insert — all inserts come from SECURITY DEFINER triggers
--   2. join_group_by_invite RPC — validates invite code server-side
--   3. group_members_insert policy — only creators can self-join directly;
--      everyone else must go through join_group_by_invite
--   4. save_devotional_edit — validates group membership + input bounds
--   5. DB-level length constraints on free-text columns
-- ============================================================

-- ── 1. Lock notifications_insert ───────────────────────────────────────────────
-- Notifications are only created by SECURITY DEFINER trigger functions
-- (create_notification), which bypass RLS. Direct client inserts must be blocked.
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- ── 2. join_group_by_invite RPC ────────────────────────────────────────────────
-- Validates invite code, checks membership, and inserts atomically.
-- Returns {group_id, group_name} on success; raises exception on failure.
CREATE OR REPLACE FUNCTION join_group_by_invite(p_invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id   uuid;
  v_group_name text;
BEGIN
  IF p_invite_code IS NULL OR char_length(trim(p_invite_code)) = 0 THEN
    RAISE EXCEPTION 'Invite code is required';
  END IF;

  SELECT id, name INTO v_group_id, v_group_name
  FROM groups
  WHERE invite_code = trim(upper(p_invite_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  INSERT INTO group_members (group_id, user_id)
  VALUES (v_group_id, auth.uid());

  RETURN jsonb_build_object('group_id', v_group_id, 'group_name', v_group_name);
END;
$$;

-- ── 3. Tighten group_members_insert policy ─────────────────────────────────────
-- Allow: group creator adding themselves (handleCreate flow).
-- Block: direct inserts from anyone else — they must use join_group_by_invite.
-- (SECURITY DEFINER functions bypass RLS so the RPC still works.)
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid()
    )
  );

-- ── 4. save_devotional_edit — add group membership + input validation ──────────
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

  IF p_content IS NULL OR char_length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Content cannot be empty';
  END IF;

  IF char_length(p_content) > 5000 THEN
    RAISE EXCEPTION 'Content exceeds 5000 character limit';
  END IF;

  IF p_visibility NOT IN ('public', 'friends', 'private') THEN
    RAISE EXCEPTION 'Invalid visibility value';
  END IF;

  IF p_group_ids IS NOT NULL AND array_length(p_group_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM unnest(p_group_ids) AS gid
      WHERE NOT EXISTS (
        SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid()
      )
    ) THEN
      RAISE EXCEPTION 'Not a member of one or more target groups';
    END IF;
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

-- ── 5. DB-level length constraints on free-text columns ────────────────────────
-- These are higher than the UI limits so valid client input is never rejected,
-- but they block abuse via direct API calls.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_name_length') THEN
    ALTER TABLE users ADD CONSTRAINT users_name_length
      CHECK (char_length(name) BETWEEN 1 AND 100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_bio_length') THEN
    ALTER TABLE users ADD CONSTRAINT users_bio_length
      CHECK (bio IS NULL OR char_length(bio) <= 300);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_church_length') THEN
    ALTER TABLE users ADD CONSTRAINT users_church_length
      CHECK (church IS NULL OR char_length(church) <= 150);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_name_length') THEN
    ALTER TABLE groups ADD CONSTRAINT groups_name_length
      CHECK (char_length(name) BETWEEN 1 AND 100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devotionals_content_length') THEN
    ALTER TABLE devotionals ADD CONSTRAINT devotionals_content_length
      CHECK (char_length(content) BETWEEN 1 AND 5000);
  END IF;
END $$;
