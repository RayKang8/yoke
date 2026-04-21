import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface GroupSummary {
  id: string;
  name: string;
  invite_code: string;
  streak: number;
  member_count: number;
  posted_today: number;
}

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useGroups() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
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
      .select('id, name, invite_code, streak')
      .in('id', groupIds);

    if (!groupsData) { setLoading(false); return; }

    // Get member counts
    const { data: allMembers } = await supabase
      .from('group_members')
      .select('group_id, user_id')
      .in('group_id', groupIds);

    // Get today's passage id
    const { data: todayPassage } = await supabase
      .from('passages')
      .select('id')
      .eq('date', todayLocalDate())
      .maybeSingle();

    // Get which members shared today's passage to each group (via devotional_groups)
    // Two-step query to avoid nested RLS join chains
    const postedToGroupIds = new Set<string>(); // "groupId:userId"
    if (todayPassage) {
      const { data: dg } = await supabase
        .from('devotional_groups')
        .select('group_id, devotional_id')
        .in('group_id', groupIds);

      if (dg && dg.length > 0) {
        const devotionalIds = [...new Set(dg.map((r: any) => r.devotional_id))];
        const { data: devos } = await supabase
          .from('devotionals')
          .select('id, user_id')
          .in('id', devotionalIds)
          .eq('passage_id', todayPassage.id);

        for (const d of devos ?? []) {
          const groups = dg.filter((r: any) => r.devotional_id === d.id);
          for (const g of groups) {
            postedToGroupIds.add(`${g.group_id}:${d.user_id}`);
          }
        }
      }
    }

    const summaries: GroupSummary[] = groupsData.map(g => {
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

  return { groups, loading, userId, refetch: fetch };
}
