-- 016_group_invites.sql
-- Direct friend-to-friend group invitations.
-- Members can invite accepted friends; invitees accept/decline in the Groups tab.

CREATE TABLE group_invites (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now()
);

-- One pending invite per (group, invitee) pair; allows re-invite after decline
CREATE UNIQUE INDEX group_invites_one_pending
  ON group_invites(group_id, invitee_id)
  WHERE status = 'pending';

CREATE INDEX idx_group_invites_invitee ON group_invites(invitee_id);
CREATE INDEX idx_group_invites_group   ON group_invites(group_id);

ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Inviter and invitee can read their own invites
CREATE POLICY "group_invites_select" ON group_invites
  FOR SELECT TO authenticated
  USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

-- Group members can invite accepted friends only
CREATE POLICY "group_invites_insert" ON group_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    inviter_id = auth.uid()
    AND group_id IN (SELECT get_my_group_ids())
    AND EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = invitee_id)
          OR (addressee_id = auth.uid() AND requester_id = invitee_id)
        )
    )
  );

-- Invitee can accept or decline
CREATE POLICY "group_invites_update" ON group_invites
  FOR UPDATE TO authenticated
  USING (invitee_id = auth.uid());

-- Inviter can cancel a pending invite
CREATE POLICY "group_invites_delete" ON group_invites
  FOR DELETE TO authenticated
  USING (inviter_id = auth.uid());

-- ── accept_group_invite RPC ────────────────────────────────────────────────────
-- Validates the invite belongs to the caller, applies the same premium gate as
-- join_group_by_invite, then atomically inserts the member row.
CREATE OR REPLACE FUNCTION accept_group_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT * INTO v_invite
  FROM group_invites
  WHERE id = p_invite_id
    AND invitee_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already responded';
  END IF;

  -- Already a member (edge case: joined via code in the meantime)
  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_invite.group_id AND user_id = auth.uid()
  ) THEN
    UPDATE group_invites SET status = 'accepted' WHERE id = p_invite_id;
    RETURN jsonb_build_object('group_id', v_invite.group_id);
  END IF;

  -- Premium gate — mirrors join_group_by_invite
  IF NOT COALESCE((SELECT premium FROM users WHERE id = auth.uid()), false)
     AND get_my_group_count() >= 1 THEN
    RAISE EXCEPTION 'Upgrade to Premium to join more than 1 group';
  END IF;

  INSERT INTO group_members (group_id, user_id) VALUES (v_invite.group_id, auth.uid());
  UPDATE group_invites SET status = 'accepted' WHERE id = p_invite_id;

  RETURN jsonb_build_object('group_id', v_invite.group_id);
END;
$$;

GRANT EXECUTE ON FUNCTION accept_group_invite(uuid) TO authenticated;
