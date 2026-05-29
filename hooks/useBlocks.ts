import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useBlocks(currentUserId: string) {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!currentUserId) return;
    const { data } = await supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`);
    const ids = new Set<string>();
    for (const row of data ?? []) {
      ids.add(row.blocker_id === currentUserId ? row.blocked_id : row.blocker_id);
    }
    setBlockedIds(ids);
  }, [currentUserId]);

  useEffect(() => { load(); }, [load]);

  async function blockUser(targetId: string): Promise<boolean> {
    const { error } = await supabase.from('blocks').insert({
      blocker_id: currentUserId,
      blocked_id: targetId,
    });
    if (!error) setBlockedIds(prev => new Set([...prev, targetId]));
    return !error;
  }

  async function unblockUser(targetId: string): Promise<boolean> {
    const { error } = await supabase.from('blocks')
      .delete()
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', targetId);
    if (!error) setBlockedIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    return !error;
  }

  return { blockedIds, blockUser, unblockUser };
}
