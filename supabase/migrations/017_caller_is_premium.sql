-- 017_caller_is_premium.sql
-- Defines caller_is_premium() which is referenced by the group_members_insert
-- RLS policy (migration 010) but was never created as a migration.
-- Without this, any direct insert into group_members fails with ERROR 42883.

CREATE OR REPLACE FUNCTION caller_is_premium()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(is_premium, false) FROM users WHERE id = auth.uid();
$$;
