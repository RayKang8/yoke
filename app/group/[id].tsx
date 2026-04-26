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
import { colors } from '../../constants/theme';
import { GroupsIcon, StreakIcon, BackIcon } from '../../components/icons';
import { FeedItem } from '../../hooks/useFeed';
import { usePremium } from '../../hooks/usePremium';

interface Member {
  user_id: string;
  user: { name: string; yoke_code: string };
}

interface GroupDetail {
  id: string;
  name: string;
  invite_code: string;
  streak: number;
  created_by: string;
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
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { loadGroup(); }, [id]);

  async function loadGroup() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const [{ data: groupData }, { data: memberData }] = await Promise.all([
      supabase.from('groups').select('*').eq('id', id).single(),
      supabase.from('group_members').select('user_id, user:users!user_id(name, yoke_code)').eq('group_id', id),
    ]);

    setGroup(groupData);
    setMembers((memberData as unknown as Member[]) ?? []);

    const { data: todayPassage } = await supabase
      .from('passages').select('id').eq('date', localDateStr()).maybeSingle();

    const { data: dgRows } = await supabase
      .from('devotional_groups')
      .select('devotional:devotionals!devotional_id(id, content, visibility, created_at, comments_disabled, passage_id, user:users!user_id(id, name, yoke_code), passage:passages!passage_id(reference, title, date), reactions(type, user_id))')
      .eq('group_id', id);

    const allDevos = (dgRows ?? []).map((r: any) => r.devotional).filter(Boolean);

    const todayDevos = todayPassage
      ? allDevos.filter((d: any) => d.passage_id === todayPassage.id)
      : [];
    const pastDevos = allDevos
      .filter((d: any) => !todayPassage || d.passage_id !== todayPassage.id)
      .sort((a: any, b: any) => {
        const da = a.passage?.date ?? '';
        const db = b.passage?.date ?? '';
        return da !== db ? db.localeCompare(da) : b.created_at.localeCompare(a.created_at);
      });

    const devoIds = allDevos.map((d: any) => d.id);
    let commentCounts: Record<string, number> = {};
    if (devoIds.length > 0) {
      const { data: comments } = await supabase
        .from('comments').select('devotional_id').in('devotional_id', devoIds);
      for (const row of comments ?? []) {
        commentCounts[row.devotional_id] = (commentCounts[row.devotional_id] ?? 0) + 1;
      }
    }

    setTodayFeed(todayDevos.map((d: any) => ({ ...d, comment_count: commentCounts[d.id] ?? 0 })) as FeedItem[]);
    setPastFeed(pastDevos.map((d: any) => ({ ...d, comment_count: commentCounts[d.id] ?? 0 })) as FeedItem[]);
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
                <View style={{ backgroundColor: c.accent, width: 36, height: 36, borderRadius: 18 }} className="items-center justify-center">
                  <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 14 }}>
                    {m.user.name[0]?.toUpperCase()}
                  </Text>
                </View>
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
