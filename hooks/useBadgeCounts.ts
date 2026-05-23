import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useBadgeCounts() {
  const [profileBadge, setProfileBadge] = useState(0);
  const [groupsBadge, setGroupsBadge] = useState(0);

  const fetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [notifResult, inviteResult] = await Promise.all([
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('read', false),
      supabase
        .from('group_invites')
        .select('id', { count: 'exact', head: true })
        .eq('invitee_id', user.id)
        .eq('status', 'pending'),
    ]);

    setProfileBadge(notifResult.count ?? 0);
    setGroupsBadge(inviteResult.count ?? 0);
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { profileBadge, groupsBadge, refetch: fetch };
}
