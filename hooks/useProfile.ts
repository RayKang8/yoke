import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

function computeStreak(dates: string[]): number {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const unique = [...new Set(dates)].sort().reverse();
  let streak = 0;
  let expected = todayStr;
  for (const date of unique) {
    if (date === expected) {
      streak++;
      const d = new Date(expected + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      break;
    }
  }
  return streak;
}

export function useProfile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [devoCount, setDevoCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: profileData }, { data: devoRows }, { count: friends }] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('devotionals').select('created_at').eq('user_id', user.id),
      supabase.from('friendships').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    ]);

    // Compute streak directly from devotional dates — don't trust the cached DB value
    const dates = (devoRows ?? []).map((r: any) => {
      if (!r.created_at) return null;
      const d = new Date(r.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }).filter(Boolean);
    const streak = computeStreak(dates);
    const longestStreak = Math.max(profileData?.longest_streak ?? 0, streak);

    // Sync back to DB if stale
    if (profileData && (profileData.streak !== streak || profileData.longest_streak !== longestStreak)) {
      supabase.from('users').update({ streak, longest_streak: longestStreak }).eq('id', user.id);
    }

    setProfile(profileData ? { ...profileData, streak, longest_streak: longestStreak } : null);
    setDevoCount(devoRows?.length ?? 0);
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
