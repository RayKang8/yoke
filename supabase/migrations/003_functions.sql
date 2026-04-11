-- ============================================================
-- 003_functions.sql
-- Helper functions and triggers.
-- ============================================================

-- Generates a unique YOKE-XXXX code
create or replace function generate_yoke_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
  done  boolean := false;
begin
  while not done loop
    code := 'YOKE-' ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1);
    -- ensure uniqueness
    done := not exists (select 1 from users where yoke_code = code);
  end loop;
  return code;
end;
$$;

-- Generates a unique YK-XXXXXX group invite code
create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
  done  boolean := false;
begin
  while not done loop
    code := 'YK-' ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substr(chars, floor(random() * length(chars) + 1)::int, 1);
    done := not exists (select 1 from groups where invite_code = code);
  end loop;
  return code;
end;
$$;

-- Auto-creates a users row when a new auth user signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, yoke_code, trial_ends_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    generate_yoke_code(),
    now() + interval '7 days'
  );
  return new;
end;
$$;

-- Attach trigger to auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
