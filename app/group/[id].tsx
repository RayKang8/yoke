import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, useColorScheme, Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { localDateStr } from '../../lib/utils';
import { DevotionalCard } from '../../components/DevotionalCard';
import { colors } from '../../constants/theme';
import { GroupsIcon, StreakIcon } from '../../components/icons';
import { FeedItem } from '../../hooks/useFeed';

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

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [todayFeed, setTodayFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

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
    setMembers((memberData as Member[]) ?? []);

    // Today's devotionals from group members
    const { data: todayPassage } = await supabase
      .from('passages').select('id').eq('date', localDateStr()).maybeSingle();

    if (todayPassage) {
      const { data: dgRows } = await supabase
        .from('devotional_groups')
        .select('devotional:devotionals!devotional_id(id, content, visibility, created_at, comments_disabled, passage_id, user:users!user_id(id, name, yoke_code), passage:passages!passage_id(reference, title), reactions(type, user_id))')
        .eq('group_id', id);

      const todayDevos = (dgRows ?? [])
        .map((r: any) => r.devotional)
        .filter((d: any) => d && d.passage_id === todayPassage.id);

      setTodayFeed(
        todayDevos.map((d: any) => ({ ...d, comment_count: 0 })) as FeedItem[]
      );
    }

    setLoading(false);
  }

  function handleReactionUpdate(devotionalId: string, reactions: { type: string; user_id: string }[]) {
    setTodayFeed(prev => prev.map(item => item.id === devotionalId ? { ...item, reactions } : item));
  }

  async function handleLeave() {
    Alert.alert('Leave group', `Leave "${group?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          await supabase.from('group_members')
            .delete()
            .eq('group_id', id)
            .eq('user_id', currentUserId);
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
    <ScrollView style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40, paddingHorizontal: 20 }}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>← Groups</Text>
      </TouchableOpacity>

      {/* Group name */}
      <Text style={{ color: c.textPrimary, fontSize: 26, fontWeight: '700', marginBottom: 4 }}>
        {group.name}
      </Text>
      <View className="flex-row items-center gap-3" style={{ marginBottom: 20 }}>
        <View className="flex-row items-center gap-1">
          <GroupsIcon active={false} size={15} />
          <Text style={{ color: c.textSecondary, fontSize: 14 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {group.streak > 0 && (
          <View className="flex-row items-center gap-1">
            <StreakIcon size={16} />
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>
              {group.streak} day streak
            </Text>
          </View>
        )}
      </View>

      {/* Invite code */}
      <TouchableOpacity
        onPress={handleShareCode}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 20 }}
      >
        <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>INVITE CODE — TAP TO SHARE</Text>
        <Text style={{ color: c.accent, fontSize: 22, fontWeight: '700', letterSpacing: 2 }}>
          {group.invite_code}
        </Text>
      </TouchableOpacity>

      {/* Members */}
      <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>Members</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, marginBottom: 24, overflow: 'hidden' }}>
        {members.map((m, i) => (
          <View key={m.user_id}
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
          </View>
        ))}
      </View>

      {/* Today's devotionals */}
      <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>
        Today's Posts
      </Text>

      {todayFeed.length === 0 ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 20, marginBottom: 24 }}>
          <Text style={{ color: c.textSecondary, textAlign: 'center', fontSize: 15 }}>
            No one has posted today yet. Be the first!
          </Text>
        </View>
      ) : (
        todayFeed.map(item => (
          <DevotionalCard
            key={item.id}
            item={item}
            currentUserId={currentUserId}
            onReactionUpdate={handleReactionUpdate}
          />
        ))
      )}

      {/* Leave group */}
      <TouchableOpacity
        onPress={handleLeave}
        style={{ borderColor: '#FF4444', borderWidth: 1, borderRadius: 14 }}
        className="py-4 items-center mt-4"
      >
        <Text style={{ color: '#FF4444', fontSize: 16, fontWeight: '500' }}>Leave Group</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
