-- 018_remove_trial.sql
-- Remove the 7-day free trial. New accounts start directly on the free tier.
-- Also documents sync_premium_status and the live join_group_by_invite (both
-- existed in the DB but were missing from migrations).

-- ── 1. Stop assigning trial_ends_at to new users ─────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, yoke_code)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    generate_yoke_code()
  );
  RETURN new;
END;
$$;

-- ── 2. sync_premium_status — document live function ──────────────────────────
-- Called by the mobile app after a RevenueCat purchase to sync is_premium.
CREATE OR REPLACE FUNCTION sync_premium_status(p_is_premium boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users SET is_premium = p_is_premium WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION sync_premium_status(boolean) TO authenticated;

-- ── 3. join_group_by_invite — document live version with premium gate ─────────
CREATE OR REPLACE FUNCTION join_group_by_invite(p_invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id   uuid;
  v_group_name text;
BEGIN
  IF p_invite_code IS NULL OR char_length(trim(p_invite_code)) = 0 THEN
    RAISE EXCEPTION 'Invite code is required';
  END IF;

  SELECT id, name INTO v_group_id, v_group_name
  FROM groups
  WHERE invite_code = trim(upper(p_invite_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  -- Free users are limited to 1 group
  IF NOT caller_is_premium() THEN
    IF (SELECT COUNT(*) FROM group_members WHERE user_id = auth.uid()) >= 1 THEN
      RAISE EXCEPTION 'Upgrade to Premium to join more than 1 group';
    END IF;
  END IF;

  INSERT INTO group_members (group_id, user_id)
  VALUES (v_group_id, auth.uid());

  RETURN jsonb_build_object('group_id', v_group_id, 'group_name', v_group_name);
END;
$$;

GRANT EXECUTE ON FUNCTION join_group_by_invite(text) TO authenticated;
