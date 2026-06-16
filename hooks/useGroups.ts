import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { localDateStr } from '../lib/utils';

export interface GroupSummary {
  id: string;
  name: string;
  invite_code: string;
  streak: number;
  member_count: number;
  posted_today: number;
  timezone?: string | null;
}

export function useGroups() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    // Get groups the user belongs to
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map(m => m.group_id);

    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name, invite_code, streak, timezone')
      .in('id', groupIds);

    if (!groupsData) { setLoading(false); return; }

    // Get member counts
    const { data: allMembers } = await supabase
      .from('group_members')
      .select('group_id, user_id')
      .in('group_id', groupIds);

    // Get today's passage id (only needed for legacy groups with no timezone)
    const hasLegacyGroups = (groupsData ?? []).some((g: any) => !g.timezone);
    const todayPassageId = hasLegacyGroups
      ? (await supabase.from('passages').select('id').eq('date', localDateStr()).maybeSingle()).data?.id ?? null
      : null;

    // Determine "posted today" per group+member.
    // Two-step query to avoid nested RLS join chains.
    // Groups with timezone: use posting timestamp in group's timezone.
    // Groups without timezone: use passage date match (legacy behavior).
    const postedToGroupIds = new Set<string>(); // "groupId:userId"
    const { data: dg } = await supabase
      .from('devotional_groups')
      .select('group_id, devotional_id')
      .in('group_id', groupIds);

    if (dg && dg.length > 0) {
      const devotionalIds = [...new Set((dg as any[]).map(r => r.devotional_id))];
      const { data: devos } = await supabase
        .from('devotionals')
        .select('id, user_id, created_at, passage_id')
        .in('id', devotionalIds);

      const devoMap = new Map((devos as any[] ?? []).map(d => [d.id, d]));

      for (const row of dg as any[]) {
        const devo = devoMap.get(row.devotional_id);
        if (!devo) continue;
        const group = (groupsData as any[]).find(g => g.id === row.group_id);
        const tz: string | null = group?.timezone ?? null;

        if (tz) {
          const groupToday = new Date().toLocaleDateString('en-CA', { timeZone: tz });
          const postDate = new Date(devo.created_at).toLocaleDateString('en-CA', { timeZone: tz });
          if (postDate === groupToday) postedToGroupIds.add(`${row.group_id}:${devo.user_id}`);
        } else if (todayPassageId && devo.passage_id === todayPassageId) {
          postedToGroupIds.add(`${row.group_id}:${devo.user_id}`);
        }
      }
    }

    const summaries: GroupSummary[] = (groupsData as any[]).map(g => {
      const members = (allMembers ?? []).filter(m => m.group_id === g.id);
      const posted = members.filter(m => postedToGroupIds.has(`${g.id}:${m.user_id}`));
      return {
        ...g,
        member_count: members.length,
        posted_today: posted.length,
      };
    });

    setGroups(summaries);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) fetch();
    });
    return () => subscription.unsubscribe();
  }, [fetch]);

  return { groups, loading, userId, refetch: fetch };
}
