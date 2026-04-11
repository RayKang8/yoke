-- ============================================================
-- 002_rls.sql
-- Enables RLS and creates all policies. Run after 001_tables.sql.
-- ============================================================

-- Enable RLS on all tables
alter table bible_verses   enable row level security;
alter table passages       enable row level security;
alter table users          enable row level security;
alter table groups         enable row level security;
alter table group_members  enable row level security;
alter table devotionals    enable row level security;
alter table reactions      enable row level security;
alter table comments       enable row level security;
alter table friendships    enable row level security;

-- ============================================================
-- bible_verses: read-only for all authenticated users
-- ============================================================
create policy "bible_verses_read" on bible_verses
  for select to authenticated using (true);

-- ============================================================
-- passages: read-only for all authenticated users
-- ============================================================
create policy "passages_read" on passages
  for select to authenticated using (true);

-- ============================================================
-- users
-- ============================================================
create policy "users_read" on users
  for select to authenticated using (true);

create policy "users_insert_own" on users
  for insert to authenticated
  with check (id = auth.uid());

create policy "users_update_own" on users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- groups
-- ============================================================
-- Anyone authenticated can read groups (needed to join by invite code)
create policy "groups_read" on groups
  for select to authenticated using (true);

create policy "groups_insert" on groups
  for insert to authenticated
  with check (created_by = auth.uid());

create policy "groups_update_own" on groups
  for update to authenticated
  using (created_by = auth.uid());

create policy "groups_delete_own" on groups
  for delete to authenticated
  using (created_by = auth.uid());

-- ============================================================
-- group_members
-- ============================================================
-- Users can see members of groups they belong to
create policy "group_members_read" on group_members
  for select to authenticated
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "group_members_insert" on group_members
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "group_members_delete_own" on group_members
  for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- devotionals
-- ============================================================
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
      and exists (
        select 1 from group_members gm
        where gm.group_id = devotionals.group_id
          and gm.user_id = auth.uid()
      )
    )
  );

create policy "devotionals_insert_own" on devotionals
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "devotionals_update_own" on devotionals
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "devotionals_delete_own" on devotionals
  for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- reactions
-- ============================================================
-- Read: same visibility rules as the parent devotional
create policy "reactions_read" on reactions
  for select to authenticated
  using (
    exists (
      select 1 from devotionals d
      where d.id = reactions.devotional_id
        and (
          d.visibility = 'public'
          or d.user_id = auth.uid()
          or (
            d.visibility = 'friends'
            and exists (
              select 1 from friendships f
              where f.status = 'accepted'
                and (
                  (f.requester_id = auth.uid() and f.addressee_id = d.user_id)
                  or
                  (f.addressee_id = auth.uid() and f.requester_id = d.user_id)
                )
            )
          )
          or (
            d.visibility = 'group'
            and exists (
              select 1 from group_members gm
              where gm.group_id = d.group_id and gm.user_id = auth.uid()
            )
          )
        )
    )
  );

create policy "reactions_insert_own" on reactions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "reactions_delete_own" on reactions
  for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- comments
-- ============================================================
-- Read: same visibility rules as the parent devotional
create policy "comments_read" on comments
  for select to authenticated
  using (
    exists (
      select 1 from devotionals d
      where d.id = comments.devotional_id
        and (
          d.visibility = 'public'
          or d.user_id = auth.uid()
          or (
            d.visibility = 'friends'
            and exists (
              select 1 from friendships f
              where f.status = 'accepted'
                and (
                  (f.requester_id = auth.uid() and f.addressee_id = d.user_id)
                  or
                  (f.addressee_id = auth.uid() and f.requester_id = d.user_id)
                )
            )
          )
          or (
            d.visibility = 'group'
            and exists (
              select 1 from group_members gm
              where gm.group_id = d.group_id and gm.user_id = auth.uid()
            )
          )
        )
    )
  );

create policy "comments_insert_own" on comments
  for insert to authenticated
  with check (user_id = auth.uid());

-- Users can delete their own comment OR delete any comment on their devotional
create policy "comments_delete" on comments
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from devotionals d
      where d.id = comments.devotional_id and d.user_id = auth.uid()
    )
  );

-- ============================================================
-- friendships
-- ============================================================
-- Users can only see their own friendship rows (both directions)
create policy "friendships_read" on friendships
  for select to authenticated
  using (
    requester_id = auth.uid() or addressee_id = auth.uid()
  );

create policy "friendships_insert" on friendships
  for insert to authenticated
  with check (requester_id = auth.uid());

-- Only the addressee can update (accept) a request
create policy "friendships_update" on friendships
  for update to authenticated
  using (addressee_id = auth.uid());

create policy "friendships_delete" on friendships
  for delete to authenticated
  using (
    requester_id = auth.uid() or addressee_id = auth.uid()
  );
