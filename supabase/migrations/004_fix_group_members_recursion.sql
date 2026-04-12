-- ============================================================
-- 004_fix_group_members_recursion.sql
-- Fixes infinite recursion in group_members RLS policy by
-- using a security definer function that bypasses RLS.
-- ============================================================

create or replace function get_my_group_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select group_id from group_members where user_id = auth.uid()
$$;

drop policy if exists "group_members_read" on group_members;

create policy "group_members_read" on group_members
  for select to authenticated
  using (
    group_id in (select get_my_group_ids())
  );

drop policy if exists "devotionals_read" on devotionals;

create policy "devotionals_read" on devotionals
  for select to authenticated
  using (
    visibility = 'public'
    or user_id = auth.uid()
    or (
      visibility = 'friends'
      and exists (
        select 1 from friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = devotionals.user_id)
            or
            (f.addressee_id = auth.uid() and f.requester_id = devotionals.user_id)
          )
      )
    )
    or (
      visibility = 'group'
      and devotionals.group_id in (select get_my_group_ids())
    )
  );
