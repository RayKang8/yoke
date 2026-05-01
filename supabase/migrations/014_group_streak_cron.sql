-- 014_group_streak_cron.sql
-- Nightly cron to recompute every group's streak so stale values
-- are cleared at midnight even when no post is made that day.

CREATE OR REPLACE FUNCTION refresh_all_group_streaks()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE groups SET streak = compute_group_streak(id);
$$;

-- Remove existing schedule if present before (re)creating it.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'refresh-group-streaks-daily';

SELECT cron.schedule(
  'refresh-group-streaks-daily',
  '1 0 * * *',
  $$ SELECT refresh_all_group_streaks(); $$
);
