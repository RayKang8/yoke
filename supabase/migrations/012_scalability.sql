-- ============================================================
-- 012_scalability.sql
-- ============================================================

-- ── 1. Indexes for hot query paths ────────────────────────────────────────────

-- Public feed: WHERE visibility='public' AND user_id != $uid ORDER BY created_at DESC
-- Partial index covers only public rows, so it stays tiny and stays ordered.
CREATE INDEX IF NOT EXISTS idx_devotionals_public_feed
  ON devotionals(created_at DESC)
  WHERE visibility = 'public';

-- Friends feed: WHERE user_id IN (...friend_ids) AND share_friends=true ORDER BY created_at DESC
-- Composite covers the equality filter (user_id) + sort (created_at) in one scan.
CREATE INDEX IF NOT EXISTS idx_devotionals_friends_feed
  ON devotionals(user_id, created_at DESC)
  WHERE share_friends = true;

-- Friendship lookups filtered by accepted status (friends feed + friend count).
-- Partial indexes are much smaller than full indexes since pending >> accepted at scale.
CREATE INDEX IF NOT EXISTS idx_friendships_requester_accepted
  ON friendships(requester_id)
  WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_friendships_addressee_accepted
  ON friendships(addressee_id)
  WHERE status = 'accepted';

-- Notifications: replace single-column index with compound so the ORDER BY
-- created_at DESC doesn't need a separate sort step.
DROP INDEX IF EXISTS idx_notifications_user_id;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- Reactions: needed when fetching who reacted (premium feature).
CREATE INDEX IF NOT EXISTS idx_reactions_user_id
  ON reactions(user_id);

-- Comments: replace single-column index with compound so per-devotional comment
-- lists come out pre-sorted without an extra sort.
DROP INDEX IF EXISTS idx_comments_devotional;
CREATE INDEX IF NOT EXISTS idx_comments_devotional_created
  ON comments(devotional_id, created_at);

-- ── 2. Schema cleanup ─────────────────────────────────────────────────────────

-- Drop legacy group_id column replaced by devotional_groups junction table
-- (all values confirmed NULL before dropping).
ALTER TABLE devotionals DROP COLUMN IF EXISTS group_id;

-- These columns are always populated; adding NOT NULL lets Postgres skip null
-- checks in query planning and makes the schema self-documenting.
ALTER TABLE devotionals ALTER COLUMN user_id    SET NOT NULL;
ALTER TABLE devotionals ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE devotionals ALTER COLUMN visibility SET NOT NULL;

-- ── 3. Server-side user streak computation ────────────────────────────────────
-- useProfile currently fetches every devotional row to the client just to run
-- computeStreak() in JS. With hundreds of devotionals this wastes bandwidth.
-- This function does the same consecutive-day grouping in SQL and returns
-- only two integers.
CREATE OR REPLACE FUNCTION compute_user_streak(p_user_id uuid)
RETURNS TABLE (streak int, longest_streak int)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH ordered_dates AS (
    SELECT DISTINCT p.date::date AS devo_date
    FROM devotionals d
    JOIN passages p ON p.id = d.passage_id
    WHERE d.user_id = p_user_id
  ),
  -- Consecutive dates share the same group when you subtract their ascending row number.
  -- e.g. Apr-26(rn1)→grp Apr-25, Apr-28(rn2)→grp Apr-26, Apr-29(rn3)→grp Apr-26
  -- A gap in dates shifts the group value, breaking the run.
  gaps AS (
    SELECT
      devo_date,
      devo_date - (ROW_NUMBER() OVER (ORDER BY devo_date ASC))::int AS grp
    FROM ordered_dates
  ),
  runs AS (
    SELECT grp, COUNT(*)::int AS run_len, MAX(devo_date) AS latest_date
    FROM gaps
    GROUP BY grp
  )
  SELECT
    -- Active streak: the run ending today or yesterday (user may not have done today yet)
    COALESCE(
      (SELECT run_len FROM runs WHERE latest_date >= CURRENT_DATE - 1
       ORDER BY latest_date DESC LIMIT 1),
      0
    ) AS streak,
    COALESCE((SELECT MAX(run_len) FROM runs), 0) AS longest_streak;
$$;

-- ── 4. Rewrite compute_group_streak() as a single SQL query ──────────────────
-- The previous version used a PL/pgSQL loop that ran 2+ SQL queries per day
-- of streak (e.g. a 30-day streak = 60 round-trips inside the function).
-- This version computes the same result in one pass using the same
-- consecutive-run grouping technique.
CREATE OR REPLACE FUNCTION compute_group_streak(p_group_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH member_count AS (
    SELECT COUNT(*) AS n FROM group_members WHERE group_id = p_group_id
  ),
  -- A calendar day counts only when every member posted a devotional for it.
  full_days AS (
    SELECT p.date::date AS devo_date
    FROM devotional_groups dg
    JOIN devotionals d ON d.id = dg.devotional_id
    JOIN passages    p ON p.id = d.passage_id
    WHERE dg.group_id = p_group_id
    GROUP BY p.date
    HAVING COUNT(DISTINCT d.user_id) >= (SELECT n FROM member_count)
  ),
  gaps AS (
    SELECT
      devo_date,
      devo_date - (ROW_NUMBER() OVER (ORDER BY devo_date ASC))::int AS grp
    FROM full_days
  ),
  runs AS (
    SELECT grp, COUNT(*)::int AS run_len, MAX(devo_date) AS latest_date
    FROM gaps
    GROUP BY grp
  )
  SELECT COALESCE(
    (SELECT run_len FROM runs WHERE latest_date >= CURRENT_DATE - 1
     ORDER BY latest_date DESC LIMIT 1),
    0
  );
$$;
