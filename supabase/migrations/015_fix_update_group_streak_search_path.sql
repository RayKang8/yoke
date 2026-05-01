-- 015_fix_update_group_streak_search_path.sql
-- update_group_streak had no SET search_path, so it inherited the empty
-- search_path from delete_user() during account deletion cascade, causing
-- "relation groups does not exist" errors.

CREATE OR REPLACE FUNCTION update_group_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_gid uuid;
BEGIN
  v_gid := CASE WHEN TG_OP = 'DELETE' THEN OLD.group_id ELSE NEW.group_id END;
  UPDATE groups SET streak = compute_group_streak(v_gid) WHERE id = v_gid;
  RETURN COALESCE(NEW, OLD);
END;
$$;
