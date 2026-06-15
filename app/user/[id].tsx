import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, useColorScheme,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { DevotionalCard } from '../../components/DevotionalCard';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../constants/theme';
import { ChurchIcon, BackIcon, CheckIcon, LockIcon } from '../../components/icons';
import { FeedItem } from '../../hooks/useFeed';
import { usePremium } from '../../hooks/usePremium';

interface UserProfile {
  id: string;
  name: string;
  yoke_code: string;
  bio: string | null;
  church: string | null;
  streak: number;
  avatar_url: string | null;
}

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { isPremium, loading: premiumLoading } = usePremium();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publicDevos, setPublicDevos] = useState<FeedItem[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [devoCount, setDevoCount] = useState(0);
  const [hasMoreDevos, setHasMoreDevos] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);

  const PAGE_SIZE = 15;

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {});
    return () => { cancelled = true; };

    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user) setCurrentUserId(user.id);

      // Check for mutual block before loading profile
      const { data: blockRows } = await supabase
        .from('blocks')
        .select('blocker_id')
        .or(`and(blocker_id.eq.${user?.id},blocked_id.eq.${id}),and(blocker_id.eq.${id},blocked_id.eq.${user?.id})`)
        .limit(1);
      if (blockRows && blockRows.length > 0) { setIsBlocked(true); setLoading(false); return; }

      const [{ data: profileData }, { data: devos }, { data: friendship }, { data: streakRows }] = await Promise.all([
        supabase.from('users').select('id, name, yoke_code, bio, church, streak, avatar_url').eq('id', id).single(),
        supabase
          .from('devotionals')
          .select('id, content, visibility, created_at, comments_disabled, user:users!user_id(id, name, yoke_code), passage:passages!passage_id(reference, title), reactions(type, user_id)')
          .eq('user_id', id)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE + 1),
        supabase
          .from('friendships')
          .select('id, requester_id, addressee_id, status')
          .or(`and(requester_id.eq.${user?.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user?.id})`)
          .maybeSingle(),
        supabase.rpc('compute_user_streak', { p_user_id: id }),
      ]);

      if (cancelled) return;
      const computedStreak = (streakRows as any)?.[0]?.streak ?? profileData?.streak ?? 0;
      setProfile(profileData ? { ...profileData, streak: computedStreak } : null);
      const page = devos ?? [];
      setHasMoreDevos(page.length > PAGE_SIZE);
      setPublicDevos(page.slice(0, PAGE_SIZE).map((d: any) => ({ ...d, comment_count: 0 })) as FeedItem[]);

      if (friendship) {
        setFriendshipId(friendship.id);
        if (friendship.status === 'accepted') {
          setFriendStatus('friends');
        } else if (friendship.requester_id === user?.id) {
          setFriendStatus('pending_sent');
        } else {
          setFriendStatus('pending_received');
        }
      }

      const { count } = await supabase
        .from('devotionals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);
      if (cancelled) return;
      setDevoCount(count ?? 0);
      setLoading(false);
    }
  }, [id]);

  async function handleAddFriend() {
    setBusy(true);
    const { data, error } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: id })
      .select()
      .single();
    setBusy(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setFriendshipId(data.id);
    setFriendStatus('pending_sent');
  }

  async function handleAccept() {
    if (!friendshipId) return;
    setBusy(true);
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    setBusy(false);
    setFriendStatus('friends');

    const { data: me } = await supabase.from('users').select('name').eq('id', currentUserId).single();
    const { sendPushToUser } = await import('../../lib/notifications');
    await sendPushToUser(id as string, 'Friend Request Accepted', `${me?.name ?? 'Someone'} accepted your Yoke friend request.`, { screen: 'profile' });
  }

  async function loadMoreDevos() {
    if (loadingMore || !hasMoreDevos || publicDevos.length === 0) return;
    setLoadingMore(true);
    const cursor = publicDevos[publicDevos.length - 1].created_at;
    const { data } = await supabase
      .from('devotionals')
      .select('id, content, visibility, created_at, comments_disabled, user:users!user_id(id, name, yoke_code), passage:passages!passage_id(reference, title), reactions(type, user_id)')
      .eq('user_id', id)
      .eq('visibility', 'public')
      .lt('created_at', cursor)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1);
    const page = data ?? [];
    setHasMoreDevos(page.length > PAGE_SIZE);
    setPublicDevos(prev => [...prev, ...page.slice(0, PAGE_SIZE).map((d: any) => ({ ...d, comment_count: 0 })) as FeedItem[]]);
    setLoadingMore(false);
  }

  async function handleRemove() {
    if (!friendshipId) return;
    Alert.alert('Remove friend', `Remove ${profile?.name} as a friend?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('friendships').delete().eq('id', friendshipId);
          setFriendStatus('none');
          setFriendshipId(null);
        },
      },
    ]);
  }

  function handleBlock() {
    Alert.alert(
      `Block ${profile?.name}?`,
      "You won't see each other's posts or profiles.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block', style: 'destructive', onPress: async () => {
            setBlockBusy(true);
            await supabase.from('blocks').insert({ blocker_id: currentUserId, blocked_id: id });
            setIsBlocked(true);
            setBlockBusy(false);
          },
        },
      ],
    );
  }

  async function handleUnblock() {
    setBlockBusy(true);
    await supabase.from('blocks').delete().eq('blocker_id', currentUserId).eq('blocked_id', id);
    setIsBlocked(false);
    setBlockBusy(false);
  }

  function FriendButton() {
    if (friendStatus === 'friends') {
      return (
        <TouchableOpacity onPress={handleRemove}
          style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ color: c.textPrimary, fontWeight: '500' }}>Friends</Text>
          <CheckIcon size={14} color={c.textPrimary} />
        </TouchableOpacity>
      );
    }
    if (friendStatus === 'pending_sent') {
      return (
        <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: c.textSecondary }}>Request Sent</Text>
        </View>
      );
    }
    if (friendStatus === 'pending_received') {
      return (
        <TouchableOpacity onPress={handleAccept} disabled={busy}
          style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
        >
          <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>Accept Request</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={handleAddFriend} disabled={busy}
        style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
      >
        {busy
          ? <ActivityIndicator color="#1A1A1A" size="small" />
          : <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>Add Friend</Text>
        }
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center">
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  if (isBlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 }}>
            <BackIcon size={16} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>Back</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ color: c.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Profile not available</Text>
          <Text style={{ color: c.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            You can't view this profile.
          </Text>
          {currentUserId && (
            <TouchableOpacity onPress={handleUnblock} disabled={blockBusy}
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
            >
              {blockBusy
                ? <ActivityIndicator color={c.textSecondary} size="small" />
                : <Text style={{ color: c.textSecondary }}>Unblock</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center">
        <Text style={{ color: c.textSecondary }}>User not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40, paddingHorizontal: 20 }}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 }}>
        <BackIcon size={16} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>Back</Text>
      </TouchableOpacity>

      {/* Profile header */}
      <View className="items-center mb-6">
        <View style={{ marginBottom: 12 }}>
          <Avatar url={profile.avatar_url} name={profile.name} size={72} accent={c.accent} />
        </View>
        <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 2 }}>{profile.name}</Text>
        <Text style={{ color: c.accent, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>{profile.yoke_code}</Text>
        {profile.bio && <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 4 }}>{profile.bio}</Text>}
        {profile.church && (
          <View className="flex-row items-center gap-1" style={{ marginTop: 2 }}>
            <ChurchIcon size={14} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>{profile.church}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View className="flex-row gap-3 mb-6">
        <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14 }} className="items-center">
          <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700' }}>{devoCount}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Devotionals</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14 }} className="items-center">
          {!premiumLoading && (isPremium
            ? <Text style={{ color: c.accent, fontSize: 22, fontWeight: '700' }}>{profile.streak}</Text>
            : <LockIcon size={20} color={c.accent} />
          )}
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Day Streak</Text>
        </View>
      </View>

      {/* Friend + Block buttons */}
      {currentUserId !== id && (
        <View className="items-center mb-8" style={{ gap: 10 }}>
          <FriendButton />
          <TouchableOpacity onPress={handleBlock} disabled={blockBusy}>
            {blockBusy
              ? <ActivityIndicator color={c.textSecondary} size="small" />
              : <Text style={{ color: c.textSecondary, fontSize: 13 }}>Block user</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Public devotionals */}
      <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>
        Public Devotionals
      </Text>

      {publicDevos.length === 0 ? (
        <Text style={{ color: c.textSecondary, fontSize: 15 }}>No public posts yet.</Text>
      ) : (
        <>
          {publicDevos.map(item => (
            <DevotionalCard
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              isPremium={isPremium}
              onReactionUpdate={(devId, reactions) =>
                setPublicDevos(prev => prev.map(d => d.id === devId ? { ...d, reactions } : d))
              }
              onBlock={() => {
                supabase.from('blocks').insert({ blocker_id: currentUserId, blocked_id: id });
                setIsBlocked(true);
              }}
            />
          ))}
          {loadingMore ? (
            <ActivityIndicator color={c.accent} style={{ marginVertical: 16 }} />
          ) : hasMoreDevos ? (
            <TouchableOpacity onPress={loadMoreDevos} style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: c.accent, fontWeight: '600', fontSize: 15 }}>Load more</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
