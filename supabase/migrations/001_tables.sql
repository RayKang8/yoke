-- ============================================================
-- 001_tables.sql
-- Creates all Yoke tables. Run this first.
-- ============================================================

-- bible_verses
create table if not exists bible_verses (
  id          serial primary key,
  translation text    not null,
  book        text    not null,
  chapter     integer not null,
  verse       integer not null,
  text        text    not null,
  unique (translation, book, chapter, verse)
);

-- passages (daily devotional content)
create table if not exists passages (
  id         uuid primary key default gen_random_uuid(),
  reference  text not null,
  text       text not null,
  date       date unique not null,
  title      text not null,
  prompt     text not null,
  theme      text check (theme in ('faith','grace','community','suffering','identity','prayer','purpose','trust','obedience')),
  plan_ref   text,
  created_at timestamptz default now()
);

-- users (extends Supabase auth.users)
create table if not exists users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text unique not null,
  name           text not null,
  yoke_code      text unique not null,
  avatar_url     text,
  bio            text,
  church         text,
  streak         integer default 0,
  longest_streak integer default 0,
  is_premium     boolean default false,
  trial_ends_at  timestamptz,
  created_at     timestamptz default now()
);

-- groups
create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references users(id) on delete set null,
  invite_code text unique not null,
  streak      integer default 0,
  created_at  timestamptz default now()
);

-- group_members
create table if not exists group_members (
  group_id  uuid references groups(id) on delete cascade,
  user_id   uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- devotionals
create table if not exists devotionals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete cascade,
  passage_id        uuid references passages(id),
  content           text not null,
  visibility        text check (visibility in ('public','friends','group')) default 'friends',
  group_id          uuid references groups(id) on delete set null,
  comments_disabled boolean default false,
  created_at        timestamptz default now(),
  unique (user_id, passage_id)
);

-- reactions
create table if not exists reactions (
  id            uuid primary key default gen_random_uuid(),
  devotional_id uuid references devotionals(id) on delete cascade,
  user_id       uuid references users(id) on delete cascade,
  type          text check (type in ('pray','amen','hit')),
  created_at    timestamptz default now(),
  unique (devotional_id, user_id, type)
);

-- comments
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  devotional_id uuid references devotionals(id) on delete cascade,
  user_id       uuid references users(id) on delete cascade,
  content       text not null check (char_length(content) <= 250),
  created_at    timestamptz default now()
);

-- friendships
create table if not exists friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid references users(id) on delete cascade,
  addressee_id uuid references users(id) on delete cascade,
  status       text check (status in ('pending','accepted')) default 'pending',
  created_at   timestamptz default now(),
  unique (requester_id, addressee_id)
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
create index if not exists idx_devotionals_user_id    on devotionals(user_id);
create index if not exists idx_devotionals_passage_id on devotionals(passage_id);
create index if not exists idx_devotionals_visibility on devotionals(visibility);
create index if not exists idx_reactions_devotional   on reactions(devotional_id);
create index if not exists idx_comments_devotional    on comments(devotional_id);
create index if not exists idx_friendships_requester  on friendships(requester_id);
create index if not exists idx_friendships_addressee  on friendships(addressee_id);
create index if not exists idx_group_members_user     on group_members(user_id);
create index if not exists idx_bible_verses_lookup    on bible_verses(translation, book, chapter);
create index if not exists idx_passages_date          on passages(date);
