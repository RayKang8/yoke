import { useEffect, useState, useCallback, useRef } from 'react';
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
    date?: string;
  };
  reactions: { type: string; user_id: string }[];
  comment_count: number;
}

const PAGE_SIZE = 20;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  // Refs mirror state so loadMore closure doesn't go stale between renders
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);

  // Fetches a page of items. Returns data or null on error/no-user.
  const fetchPage = useCallback(async (cursor: string | null): Promise<FeedItem[] | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let query = supabase
      .from('devotionals')
      .select(FEED_SELECT)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) query = query.lt('created_at', cursor);

    if (tab === 'public') {
      query = query.eq('visibility', 'public').neq('user_id', user.id);
    } else {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = (friendships ?? []).map(f =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      if (friendIds.length === 0) return [];

      query = query.in('user_id', friendIds).eq('share_friends', true);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) return null;

    const counts = await fetchCommentCounts((data ?? []).map((d: any) => d.id));
    return attachCounts(data ?? [], counts);
  }, [tab]);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setItems([]); }
    else setRefreshing(true);

    cursorRef.current = null;
    const data = await fetchPage(null);

    if (data === null) {
      setError('Could not load feed. Pull to refresh.');
    } else {
      setError(null);
      setItems(data);
      hasMoreRef.current = data.length === PAGE_SIZE;
      setHasMore(hasMoreRef.current);
      cursorRef.current = data.length > 0 ? data[data.length - 1].created_at : null;
    }

    setLoading(false);
    setRefreshing(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || !cursorRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    const data = await fetchPage(cursorRef.current);
    if (data !== null) {
      setItems(prev => [...prev, ...data]);
      hasMoreRef.current = data.length === PAGE_SIZE;
      setHasMore(hasMoreRef.current);
      cursorRef.current = data.length > 0 ? data[data.length - 1].created_at : null;
    }

    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [fetchPage]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh: () => fetch(true),
    loadMore,
  };
}
