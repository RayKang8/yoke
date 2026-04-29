import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [devoCount, setDevoCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: profileData }, { count: devoTotal }, { count: friends }, { data: streakRows }] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('devotionals').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('friendships').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
      supabase.rpc('compute_user_streak', { p_user_id: user.id }),
    ]);

    const streak = (streakRows as any)?.[0]?.streak ?? 0;
    const longestStreak = Math.max(profileData?.longest_streak ?? 0, (streakRows as any)?.[0]?.longest_streak ?? 0);

    // Sync back to DB if stale (fire-and-forget — non-critical background update)
    if (profileData && (profileData.streak !== streak || profileData.longest_streak !== longestStreak)) {
      void supabase.from('users').update({ streak, longest_streak: longestStreak }).eq('id', user.id);
    }

    setProfile(profileData ? { ...profileData, streak, longest_streak: longestStreak } : null);
    setDevoCount(devoTotal ?? 0);
    setFriendCount(friends ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateProfile(updates: Partial<Pick<User, 'name' | 'bio' | 'church'>>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
    if (data) setProfile(prev => prev ? { ...prev, ...data } : data);
  }

  return { profile, devoCount, friendCount, loading, refetch: fetch, updateProfile };
}
