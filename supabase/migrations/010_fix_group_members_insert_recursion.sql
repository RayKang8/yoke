-- ============================================================
-- 010_fix_group_members_insert_recursion.sql
-- The group_members_insert policy contained a direct sub-query
-- on group_members (NOT EXISTS ...) inside its WITH CHECK.
-- This sub-query triggers the group_members_read SELECT policy,
-- which calls get_my_group_ids() — but PostgreSQL's recursion
-- detector fires before the SECURITY DEFINER path is taken,
-- producing ERROR 42P17 on every group creator self-insert.
--
-- Fix: wrap the member-count check in a SECURITY DEFINER
-- function so the policy never directly references group_members.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_group_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*) FROM group_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "group_members_insert" ON group_members;

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_id AND created_by = auth.uid()
    )
    AND (caller_is_premium() OR get_my_group_count() = 0)
  );
