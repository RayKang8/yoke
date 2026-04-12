import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FriendUser {
  id: string;
  name: string;
  yoke_code: string;
  bio: string | null;
  church: string | null;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  other_user: FriendUser;
}

export function useFriends() {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]); // pending requests sent TO me
  const [sent, setSent] = useState<FriendRequest[]>([]);          // pending requests I sent
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);

    const { data: rows } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!rows) { setLoading(false); return; }

    // Collect all user IDs we need to look up
    const otherIds = rows.map(r => r.requester_id === user.id ? r.addressee_id : r.requester_id);
    const uniqueIds = [...new Set(otherIds)];

    const { data: usersData } = await supabase
      .from('users')
      .select('id, name, yoke_code, bio, church')
      .in('id', uniqueIds);

    const userMap: Record<string, FriendUser> = {};
    for (const u of usersData ?? []) userMap[u.id] = u;

    const enriched: FriendRequest[] = rows.map(r => ({
      ...r,
      other_user: userMap[r.requester_id === user.id ? r.addressee_id : r.requester_id],
    }));

    setFriends(
      enriched.filter(r => r.status === 'accepted').map(r => r.other_user).filter(Boolean)
    );
    setReceived(
      enriched.filter(r => r.status === 'pending' && r.addressee_id === user.id)
    );
    setSent(
      enriched.filter(r => r.status === 'pending' && r.requester_id === user.id)
    );

    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { friends, received, sent, loading, currentUserId, refetch: fetch };
}
