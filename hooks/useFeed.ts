import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FeedItem {
  id: string;
  content: string;
  visibility: string;
  created_at: string;
  comments_disabled: boolean;
  user: {
    id: string;
    name: string;
    yoke_code: string;
  };
  passage: {
    reference: string;
    title: string;
  };
  reactions: { type: string; user_id: string }[];
  comment_count: number;
}

const FEED_SELECT = `
  id, content, visibility, created_at, comments_disabled,
  user:users!user_id(id, name, yoke_code),
  passage:passages!passage_id(reference, title),
  reactions(type, user_id)
`;

async function fetchCommentCounts(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from('comments')
    .select('devotional_id')
    .in('devotional_id', ids);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.devotional_id] = (counts[row.devotional_id] ?? 0) + 1;
  }
  return counts;
}

function attachCounts(items: any[], counts: Record<string, number>): FeedItem[] {
  return items.map(item => ({ ...item, comment_count: counts[item.id] ?? 0 }));
}

export function useFeed(tab: 'public' | 'friends') {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    let query = supabase
      .from('devotionals')
      .select(FEED_SELECT)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setRefreshing(false); return; }

    if (tab === 'public') {
      query = query
        .eq('visibility', 'public')
        .neq('user_id', user.id);
    } else {
      // friends: accepted friends' posts only (not own)
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = (friendships ?? []).map(f =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      if (friendIds.length === 0) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      query = query
        .in('user_id', friendIds)
        .in('visibility', ['public', 'friends']);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError('Could not load feed. Pull to refresh.');
    } else if (data) {
      setError(null);
      const counts = await fetchCommentCounts(data.map((d: any) => d.id));
      setItems(attachCounts(data, counts));
    }
    setLoading(false);
    setRefreshing(false);
  }, [tab]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, refreshing, error, refresh: () => fetch(true) };
}
