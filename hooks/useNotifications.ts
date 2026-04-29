import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'reaction' | 'comment';
  read: boolean;
  created_at: string;
  actor: { id: string; name: string; avatar_url: string | null } | null;
  devotional_id: string | null;
  friendship_id: string | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, type, read, created_at, devotional_id, friendship_id, actor:users!actor_id(id, name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    const list = (data ?? []) as unknown as AppNotification[];
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.read).length);
    setLoading(false);
  }, []);

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  return { notifications, unreadCount, loading, fetch, markAllRead, markRead };
}
