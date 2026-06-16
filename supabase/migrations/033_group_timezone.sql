-- Add canonical timezone to groups for cross-timezone streak support.
-- NULL on existing rows → legacy passage-date behavior is preserved exactly.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Rewrite compute_group_streak with dual-mode logic:
--   timezone IS NULL  → legacy: group by passage date   (all existing groups unchanged)
--   timezone IS SET   → new:    group by posting time in group's canonical timezone
CREATE OR REPLACE FUNCTION compute_group_streak(p_group_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_tz     text;
  v_result integer;
BEGIN
  SELECT timezone INTO v_tz FROM groups WHERE id = p_group_id;

  IF v_tz IS NOT NULL THEN
    -- New mode: a calendar day (in the group's timezone) counts when every member
    -- posted at least once during that day, regardless of which passage they posted.
    WITH member_count AS (
      SELECT COUNT(*) AS n FROM group_members WHERE group_id = p_group_id
    ),
    full_days AS (
      SELECT (d.created_at AT TIME ZONE v_tz)::date AS devo_date
      FROM devotional_groups dg
      JOIN devotionals d ON d.id = dg.devotional_id
      WHERE dg.group_id = p_group_id
      GROUP BY 1
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
      FROM gaps GROUP BY grp
    )
    SELECT COALESCE(
      (SELECT run_len FROM runs
       WHERE latest_date >= (CURRENT_TIMESTAMP AT TIME ZONE v_tz)::date - 1
       ORDER BY latest_date DESC LIMIT 1),
      0
    ) INTO v_result;

  ELSE
    -- Legacy mode: unchanged — a day counts when every member posted a devotional
    -- whose passage date matches (passage date is local to each member).
    WITH member_count AS (
      SELECT COUNT(*) AS n FROM group_members WHERE group_id = p_group_id
    ),
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
      FROM gaps GROUP BY grp
    )
    SELECT COALESCE(
      (SELECT run_len FROM runs WHERE latest_date >= CURRENT_DATE - 1
       ORDER BY latest_date DESC LIMIT 1),
      0
    ) INTO v_result;

  END IF;

  RETURN v_result;
END;
$$;
