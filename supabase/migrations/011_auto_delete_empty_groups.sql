-- ============================================================
-- 011_auto_delete_empty_groups.sql
-- When the last member leaves a group, the group is deleted
-- automatically. Cascading FK on group_members ensures all
-- related devotional_groups rows are cleaned up too.
-- ============================================================

CREATE OR REPLACE FUNCTION delete_group_if_empty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = OLD.group_id
  ) THEN
    DELETE FROM groups WHERE id = OLD.group_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_group_member_deleted ON group_members;
CREATE TRIGGER on_group_member_deleted
  AFTER DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION delete_group_if_empty();
