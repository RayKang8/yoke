import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, useColorScheme,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { DevotionalCard } from '../../components/DevotionalCard';
import { colors } from '../../constants/theme';
import { ChurchIcon } from '../../components/icons';
import { FeedItem } from '../../hooks/useFeed';

interface UserProfile {
  id: string;
  name: string;
  yoke_code: string;
  bio: string | null;
  church: string | null;
  streak: number;
}

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publicDevos, setPublicDevos] = useState<FeedItem[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [devoCount, setDevoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const [{ data: profileData }, { data: devos }, { data: friendship }] = await Promise.all([
      supabase.from('users').select('id, name, yoke_code, bio, church, streak').eq('id', id).single(),
      supabase
        .from('devotionals')
        .select('id, content, visibility, created_at, comments_disabled, user:users!user_id(id, name, yoke_code), passage:passages!passage_id(reference, title), reactions(type, user_id)')
        .eq('user_id', id)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(`and(requester_id.eq.${user?.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user?.id})`)
        .maybeSingle(),
    ]);

    setProfile(profileData);
    setPublicDevos((devos ?? []).map((d: any) => ({ ...d, comment_count: 0 })) as FeedItem[]);

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

    // Count total devotionals
    const { count } = await supabase
      .from('devotionals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);
    setDevoCount(count ?? 0);

    setLoading(false);
  }

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

  function FriendButton() {
    if (friendStatus === 'friends') {
      return (
        <TouchableOpacity onPress={handleRemove}
          style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
        >
          <Text style={{ color: c.textPrimary, fontWeight: '500' }}>Friends ✓</Text>
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
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      {/* Profile header */}
      <View className="items-center mb-6">
        <View style={{ backgroundColor: c.accent, width: 72, height: 72, borderRadius: 36 }} className="items-center justify-center mb-3">
          <Text style={{ color: '#1A1A1A', fontSize: 28, fontWeight: '700' }}>
            {profile.name[0]?.toUpperCase()}
          </Text>
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
          <Text style={{ color: c.accent, fontSize: 22, fontWeight: '700' }}>{profile.streak}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Day Streak</Text>
        </View>
      </View>

      {/* Friend button */}
      {currentUserId !== id && (
        <View className="items-center mb-8">
          <FriendButton />
        </View>
      )}

      {/* Public devotionals */}
      <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>
        Public Devotionals
      </Text>

      {publicDevos.length === 0 ? (
        <Text style={{ color: c.textSecondary, fontSize: 15 }}>No public posts yet.</Text>
      ) : (
        publicDevos.map(item => (
          <DevotionalCard
            key={item.id}
            item={item}
            currentUserId={currentUserId}
            onReactionUpdate={(devId, reactions) =>
              setPublicDevos(prev => prev.map(d => d.id === devId ? { ...d, reactions } : d))
            }
          />
        ))
      )}
    </ScrollView>
  );
}
