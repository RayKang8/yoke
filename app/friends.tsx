import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, useColorScheme, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useFriends } from '../hooks/useFriends';
import { sendPushToUser } from '../lib/notifications';
import { haptics } from '../lib/haptics';
import { colors } from '../constants/theme';
import { BackIcon, CheckIcon } from '../components/icons';

interface SearchResult {
  id: string;
  name: string;
  yoke_code: string;
  church: string | null;
  friendStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received';
}

export default function FriendsScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { friends, received, sent, loading, currentUserId, refetch } = useFriends();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeq = useRef(0);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function handleQueryChange(text: string) {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(() => runSearch(text.trim()), 300);
  }

  async function runSearch(q: string) {
    const seq = ++searchSeq.current;
    setSearching(true);
    const { data: users } = await supabase
      .from('users')
      .select('id, name, yoke_code, church')
      .or(`name.ilike.%${q}%,yoke_code.ilike.%${q}%`)
      .neq('id', currentUserId)
      .limit(10);

    if (seq !== searchSeq.current) return;
    if (!users) { setSearching(false); return; }

    // Fetch friendship statuses for results
    const ids = users.map(u => u.id);
    const { data: fships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .or(ids.map(id => `and(requester_id.eq.${currentUserId},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${currentUserId})`).join(','));

    const results: SearchResult[] = users.map(u => {
      const f = (fships ?? []).find(fs =>
        (fs.requester_id === currentUserId && fs.addressee_id === u.id) ||
        (fs.requester_id === u.id && fs.addressee_id === currentUserId)
      );
      let friendStatus: SearchResult['friendStatus'] = 'none';
      if (f) {
        if (f.status === 'accepted') friendStatus = 'friends';
        else if (f.requester_id === currentUserId) friendStatus = 'pending_sent';
        else friendStatus = 'pending_received';
      }
      return { ...u, friendStatus };
    });

    if (seq !== searchSeq.current) return;
    setSearchResults(results);
    setSearching(false);
  }

  async function sendRequest(target: SearchResult) {
    setAddingId(target.id);
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: target.id });

    if (error) { Alert.alert('Error', error.message); setAddingId(null); return; }

    haptics.success();
    setSearchResults(prev => prev.map(r => r.id === target.id ? { ...r, friendStatus: 'pending_sent' } : r));
    const { data: me } = await supabase.from('users').select('name').eq('id', currentUserId).single();
    await sendPushToUser(target.id, 'New Friend Request', `${me?.name ?? 'Someone'} wants to be Yoke friends.`, { screen: 'profile', userId: currentUserId });
    setAddingId(null);
    refetch();
  }

  async function acceptRequest(friendshipId: string) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    haptics.success();

    const req = received.find(r => r.id === friendshipId);
    if (req?.other_user) {
      const { data: me } = await supabase.from('users').select('name').eq('id', currentUserId).single();
      await sendPushToUser(req.other_user.id, 'Friend Request Accepted', `${me?.name ?? 'Someone'} accepted your Yoke friend request.`, { screen: 'profile' });
    }

    refetch();
  }

  async function declineRequest(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    refetch();
  }

  async function cancelRequest(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    refetch();
  }

  async function removeFriend(friendId: string) {
    Alert.alert('Remove friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase
            .from('friendships')
            .delete()
            .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${currentUserId})`);
          refetch();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 }}>
        <BackIcon size={16} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>Back</Text>
      </TouchableOpacity>

      <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 24 }}>Friends</Text>

      {/* Search */}
      <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>FIND PEOPLE</Text>
      <View style={{ position: 'relative', marginBottom: searchResults.length > 0 ? 0 : 24 }}>
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search by name or Yoke code..."
          placeholderTextColor={c.textSecondary}
          style={{
            backgroundColor: c.surface, color: c.textPrimary,
            borderColor: c.border, borderWidth: 1, borderRadius: 12,
            padding: 13, fontSize: 16,
          }}
        />
        {searching && (
          <ActivityIndicator
            color={c.accent} size="small"
            style={{ position: 'absolute', right: 14, top: 14 }}
          />
        )}
      </View>

      {/* Search results */}
      {searchResults.length > 0 && (
        <View style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, marginBottom: 24, overflow: 'hidden' }}>
          {searchResults.map((result, i) => (
            <View
              key={result.id}
              style={{ padding: 14, borderBottomWidth: i < searchResults.length - 1 ? 1 : 0, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <TouchableOpacity className="flex-row items-center gap-3 flex-1" onPress={() => router.push(`/user/${result.id}`)}>
                <View style={{ backgroundColor: c.accent, width: 38, height: 38, borderRadius: 19 }} className="items-center justify-center">
                  <Text style={{ color: '#1A1A1A', fontWeight: '700' }}>{result.name[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 15 }}>{result.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>{result.yoke_code}</Text>
                </View>
              </TouchableOpacity>

              {result.friendStatus === 'none' && (
                <TouchableOpacity
                  onPress={() => sendRequest(result)}
                  disabled={addingId === result.id}
                  style={{ backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}
                >
                  {addingId === result.id
                    ? <ActivityIndicator color="#1A1A1A" size="small" />
                    : <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 13 }}>Add</Text>
                  }
                </TouchableOpacity>
              )}
              {result.friendStatus === 'pending_sent' && (
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>Sent</Text>
              )}
              {result.friendStatus === 'pending_received' && (
                <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Wants to add you</Text>
              )}
              {result.friendStatus === 'friends' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Friends</Text>
                  <CheckIcon size={12} color={c.accent} />
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 20 }} />
      ) : (
        <>
          {/* Pending received requests */}
          {received.length > 0 && (
            <>
              <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>
                Requests ({received.length})
              </Text>
              {received.map(req => (
                <View key={req.id}
                  style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 }}
                  className="flex-row items-center gap-3"
                >
                  <View style={{ backgroundColor: c.accent, width: 40, height: 40, borderRadius: 20 }} className="items-center justify-center">
                    <Text style={{ color: '#1A1A1A', fontWeight: '700' }}>
                      {req.other_user?.name?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 15 }}>{req.other_user?.name}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>{req.other_user?.yoke_code}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => acceptRequest(req.id)}
                      style={{ backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
                    >
                      <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 13 }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => declineRequest(req.id)}
                      style={{ backgroundColor: c.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: c.border }}
                    >
                      <Text style={{ color: c.textSecondary, fontSize: 13 }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: c.border, marginBottom: 20 }} />
            </>
          )}

          {/* Friends list */}
          <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>
            Friends {friends.length > 0 ? `(${friends.length})` : ''}
          </Text>

          {friends.length === 0 ? (
            <Text style={{ color: c.textSecondary, fontSize: 15, lineHeight: 22 }}>
              No friends yet. Add someone using their Yoke code above.
            </Text>
          ) : (
            friends.map(friend => (
              <TouchableOpacity
                key={friend.id}
                onPress={() => router.push(`/user/${friend.id}`)}
                style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 }}
                className="flex-row items-center gap-3"
              >
                <View style={{ backgroundColor: c.accent, width: 40, height: 40, borderRadius: 20 }} className="items-center justify-center">
                  <Text style={{ color: '#1A1A1A', fontWeight: '700' }}>
                    {friend.name[0]?.toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 15 }}>{friend.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>{friend.yoke_code}</Text>
                  {friend.church && <Text style={{ color: c.textSecondary, fontSize: 12 }}>{friend.church}</Text>}
                </View>
                <TouchableOpacity onPress={() => removeFriend(friend.id)} className="p-2">
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>Remove</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}

          {/* Sent pending */}
          {sent.length > 0 && (
            <>
              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 20 }} />
              <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 10 }}>
                PENDING SENT ({sent.length})
              </Text>
              {sent.map(req => (
                <View key={req.id}
                  style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 }}
                  className="flex-row items-center gap-3"
                >
                  <View style={{ backgroundColor: c.border, width: 40, height: 40, borderRadius: 20 }} className="items-center justify-center">
                    <Text style={{ color: c.textSecondary, fontWeight: '700' }}>
                      {req.other_user?.name?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: c.textPrimary, fontSize: 15 }}>{req.other_user?.name}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>{req.other_user?.yoke_code}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => cancelRequest(req.id)}
                    style={{ backgroundColor: c.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: c.border }}
                  >
                    <Text style={{ color: c.textSecondary, fontSize: 13 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
