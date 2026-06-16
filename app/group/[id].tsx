import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, useColorScheme, Share, Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { localDateStr } from '../../lib/utils';
import { DevotionalCard } from '../../components/DevotionalCard';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../constants/theme';
import { GroupsIcon, StreakIcon, BackIcon } from '../../components/icons';
import { FeedItem } from '../../hooks/useFeed';
import { usePremium } from '../../hooks/usePremium';
import { sendPushToUser } from '../../lib/notifications';

interface Member {
  user_id: string;
  user: { name: string; yoke_code: string; avatar_url: string | null };
}

interface InvitableFriend {
  id: string;
  name: string;
  yoke_code: string;
  avatar_url: string | null;
}

interface GroupDetail {
  id: string;
  name: string;
  invite_code: string;
  streak: number;
  created_by: string;
  timezone?: string | null;
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [todayFeed, setTodayFeed] = useState<FeedItem[]>([]);
  const [pastFeed, setPastFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [invitableFriends, setInvitableFriends] = useState<InvitableFriend[]>([]);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => { loadGroup(); }, [id]);

  async function loadGroup() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const ids = new Set<string>();
    if (user) {
      const { data: blockRows } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
      for (const row of blockRows ?? []) {
        ids.add(row.blocker_id === user.id ? row.blocked_id : row.blocker_id);
      }
      setBlockedIds(ids);
    }

    const [{ data: groupData }, { data: memberData }] = await Promise.all([
      supabase.from('groups').select('*').eq('id', id).single(),
      supabase.from('group_members').select('user_id, user:users!user_id(name, yoke_code, avatar_url)').eq('group_id', id),
    ]);

    setGroup(groupData);
    setMembers((memberData as unknown as Member[]) ?? []);

    // Groups with a canonical timezone: "today" is determined by that timezone,
    // and any devotional posted within today's window counts (passage date irrelevant).
    // Legacy groups (timezone = null): keep original passage-date matching.
    const groupTz: string | null = (groupData as any)?.timezone ?? null;

    let todayPassageId: string | null = null;
    if (!groupTz) {
      const { data: tp } = await supabase
        .from('passages').select('id').eq('date', localDateStr()).maybeSingle();
      todayPassageId = tp?.id ?? null;
    }

    const { data: dgRows } = await supabase
      .from('devotional_groups')
      .select('devotional:devotionals!devotional_id(id, content, visibility, created_at, comments_disabled, passage_id, user:users!user_id(id, name, yoke_code, avatar_url), passage:passages!passage_id(reference, title, date), reactions(type, user_id))')
      .eq('group_id', id);

    const allDevos = (dgRows ?? []).map((r: any) => r.devotional).filter(Boolean);

    const isToday = groupTz
      ? (() => {
          const groupToday = new Date().toLocaleDateString('en-CA', { timeZone: groupTz });
          return (d: any) =>
            new Date(d.created_at).toLocaleDateString('en-CA', { timeZone: groupTz }) === groupToday;
        })()
      : (d: any) => todayPassageId && d.passage_id === todayPassageId;

    const todayDevos = allDevos.filter(isToday);
    const pastDevos = allDevos
      .filter((d: any) => !isToday(d))
      .sort((a: any, b: any) => {
        const da = a.passage?.date ?? '';
        const db = b.passage?.date ?? '';
        return da !== db ? db.localeCompare(da) : b.created_at.localeCompare(a.created_at);
      })
      .slice(0, 50);

    const devoIds = allDevos.map((d: any) => d.id);
    let commentCounts: Record<string, number> = {};
    if (devoIds.length > 0) {
      const { data: comments } = await supabase
        .from('comments').select('devotional_id').in('devotional_id', devoIds);
      for (const row of comments ?? []) {
        commentCounts[row.devotional_id] = (commentCounts[row.devotional_id] ?? 0) + 1;
      }
    }

    const notBlocked = (d: any) => !ids.has(d.user?.id);
    setTodayFeed(todayDevos.filter(notBlocked).map((d: any) => ({ ...d, comment_count: commentCounts[d.id] ?? 0 })) as FeedItem[]);
    setPastFeed(pastDevos.filter(notBlocked).map((d: any) => ({ ...d, comment_count: commentCounts[d.id] ?? 0 })) as FeedItem[]);
    setLoading(false);
  }

  function handleReactionUpdate(devotionalId: string, reactions: { type: string; user_id: string }[]) {
    const update = (prev: FeedItem[]) =>
      prev.map(item => item.id === devotionalId ? { ...item, reactions } : item);
    setTodayFeed(update);
    setPastFeed(update);
  }

  async function handleLeave() {
    Alert.alert('Leave group', `Leave "${group?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          await supabase.from('group_members')
            .delete().eq('group_id', id).eq('user_id', currentUserId);
          router.back();
        },
      },
    ]);
  }

  useEffect(() => {
    if (showSettings) loadInvitableFriends();
  }, [showSettings, members, currentUserId, id]);

  async function loadInvitableFriends() {
    setInviteLoading(true);
    const memberIds = new Set(members.map(m => m.user_id));

    const [{ data: friendships }, { data: existingInvites }] = await Promise.all([
      supabase
        .from('friendships')
        .select('requester_id, addressee_id, requester:users!requester_id(id, name, yoke_code, avatar_url), addressee:users!addressee_id(id, name, yoke_code, avatar_url)')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`),
      supabase
        .from('group_invites')
        .select('invitee_id')
        .eq('group_id', id)
        .eq('status', 'pending'),
    ]);

    const pendingInviteeIds = new Set((existingInvites ?? []).map((i: any) => i.invitee_id));
    const invitable = (friendships ?? [])
      .map((f: any) => f.requester_id === currentUserId ? f.addressee : f.requester)
      .filter((f: any) => f && !memberIds.has(f.id) && !pendingInviteeIds.has(f.id));

    setInvitableFriends(invitable);
    setInvitedIds(new Set());
    setInviteLoading(false);
  }

  async function handleSendInvite(friend: InvitableFriend) {
    const { error } = await supabase.from('group_invites').insert({
      group_id: id,
      inviter_id: currentUserId,
      invitee_id: friend.id,
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setInvitedIds(prev => new Set(prev).add(friend.id));
    sendPushToUser(
      friend.id,
      'Group invite',
      `You've been invited to join "${group?.name}" on Yoke.`,
      { screen: 'groups' },
    ).catch(() => {});
  }

  async function handleShareCode() {
    if (!group) return;
    Share.share({ message: `Join my Yoke group "${group.name}"! Invite code: ${group.invite_code}` });
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center">
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center">
        <Text style={{ color: c.textSecondary }}>Group not found.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40, paddingHorizontal: 20 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <BackIcon size={16} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={{ backgroundColor: c.surface, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 7 }}
          >
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Group name + meta */}
        <Text style={{ color: c.textPrimary, fontSize: 26, fontWeight: '700', marginBottom: 4 }}>
          {group.name}
        </Text>
        <View className="flex-row items-center gap-3" style={{ marginBottom: 24 }}>
          <View className="flex-row items-center gap-1">
            <GroupsIcon active={false} size={15} />
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {isPremium && group.streak > 0 && (
            <View className="flex-row items-center gap-1">
              <StreakIcon size={16} />
              <Text style={{ color: c.textSecondary, fontSize: 14 }}>{group.streak} day streak</Text>
            </View>
          )}
        </View>

        {/* Today's posts */}
        <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 12 }}>
          TODAY'S POSTS
        </Text>
        {todayFeed.length === 0 ? (
          <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 20, marginBottom: 24 }}>
            <Text style={{ color: c.textSecondary, textAlign: 'center', fontSize: 15 }}>
              No one has posted today yet. Be the first!
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 24 }}>
            {todayFeed.map(item => (
              <DevotionalCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                isPremium={isPremium}
                onReactionUpdate={handleReactionUpdate}
                onBlock={userId => {
                  supabase.from('blocks').insert({ blocker_id: currentUserId, blocked_id: userId });
                  setTodayFeed(prev => prev.filter(d => d.user.id !== userId));
                  setPastFeed(prev => prev.filter(d => d.user.id !== userId));
                }}
              />
            ))}
          </View>
        )}

        {/* Past posts */}
        {pastFeed.length > 0 && (
          <>
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 12 }}>
              PAST POSTS
            </Text>
            {pastFeed.map(item => (
              <DevotionalCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                isPremium={isPremium}
                onReactionUpdate={handleReactionUpdate}
                onBlock={userId => {
                  supabase.from('blocks').insert({ blocker_id: currentUserId, blocked_id: userId });
                  setTodayFeed(prev => prev.filter(d => d.user.id !== userId));
                  setPastFeed(prev => prev.filter(d => d.user.id !== userId));
                }}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Settings modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: c.background }}
          contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: 48 }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700' }}>Group Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Invite code */}
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>INVITE CODE</Text>
          <TouchableOpacity
            onPress={handleShareCode}
            style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 24 }}
          >
            <Text style={{ color: c.accent, fontSize: 26, fontWeight: '700', letterSpacing: 3 }}>{group.invite_code}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4 }}>Tap to share with friends</Text>
          </TouchableOpacity>

          {/* Invite a friend */}
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>INVITE A FRIEND</Text>
          {inviteLoading ? (
            <ActivityIndicator color={c.accent} style={{ marginBottom: 24 }} />
          ) : invitableFriends.length === 0 ? (
            <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 24 }}>
              <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center' }}>
                No friends to invite — add friends in the app or they may already be in this group.
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, marginBottom: 24, overflow: 'hidden' }}>
              {invitableFriends.map((f, i) => {
                const invited = invitedIds.has(f.id);
                return (
                  <View
                    key={f.id}
                    style={{ padding: 14, borderBottomWidth: i < invitableFriends.length - 1 ? 1 : 0, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <Avatar url={f.avatar_url} name={f.name} size={36} accent={c.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.textPrimary, fontWeight: '500', fontSize: 15 }}>{f.name}</Text>
                      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{f.yoke_code}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => !invited && handleSendInvite(f)}
                      disabled={invited}
                      style={{ backgroundColor: invited ? c.border : c.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}
                    >
                      <Text style={{ color: invited ? c.textSecondary : '#1A1A1A', fontSize: 13, fontWeight: '600' }}>
                        {invited ? 'Invited' : 'Invite'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Members */}
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>MEMBERS</Text>
          <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, marginBottom: 32, overflow: 'hidden' }}>
            {members.map((m, i) => (
              <TouchableOpacity
                key={m.user_id}
                onPress={() => m.user_id !== currentUserId && router.push(`/user/${m.user_id}` as any)}
                activeOpacity={m.user_id === currentUserId ? 1 : 0.7}
                style={{ padding: 14, borderBottomWidth: i < members.length - 1 ? 1 : 0, borderBottomColor: c.border }}
                className="flex-row items-center gap-3"
              >
                <Avatar url={m.user.avatar_url} name={m.user.name} size={36} accent={c.accent} />
                <View>
                  <Text style={{ color: c.textPrimary, fontWeight: '500', fontSize: 15 }}>{m.user.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>{m.user.yoke_code}</Text>
                </View>
                {m.user_id === currentUserId && (
                  <Text style={{ color: c.textSecondary, fontSize: 12, marginLeft: 'auto' }}>You</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Leave group */}
          <TouchableOpacity
            onPress={handleLeave}
            style={{ borderColor: '#FF4444', borderWidth: 1, borderRadius: 14 }}
            className="py-4 items-center"
          >
            <Text style={{ color: '#FF4444', fontSize: 16, fontWeight: '500' }}>Leave Group</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </>
  );
}
