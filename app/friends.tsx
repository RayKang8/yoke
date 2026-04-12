import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, useColorScheme, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useFriends } from '../hooks/useFriends';
import { colors } from '../constants/theme';

export default function FriendsScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { friends, received, sent, loading, currentUserId, refetch } = useFriends();

  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function sendRequest() {
    const yokeCode = code.trim().toUpperCase();
    if (!yokeCode) return;
    setSearching(true);

    const { data: target } = await supabase
      .from('users')
      .select('id, name, yoke_code')
      .eq('yoke_code', yokeCode)
      .maybeSingle();

    if (!target) {
      Alert.alert('Not found', 'No user found with that Yoke code.');
      setSearching(false);
      return;
    }

    if (target.id === currentUserId) {
      Alert.alert('That\'s you!', 'You can\'t add yourself as a friend.');
      setSearching(false);
      return;
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${currentUserId})`)
      .maybeSingle();

    if (existing) {
      Alert.alert(
        existing.status === 'accepted' ? 'Already friends' : 'Request already sent',
        existing.status === 'accepted'
          ? `You and ${target.name} are already friends.`
          : `A friend request with ${target.name} is already pending.`
      );
      setSearching(false);
      return;
    }

    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: target.id });

    setSearching(false);
    if (error) { Alert.alert('Error', error.message); return; }

    setCode('');
    Alert.alert('Request sent!', `Friend request sent to ${target.name}.`);
    refetch();
  }

  async function acceptRequest(friendshipId: string) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    refetch();
  }

  async function declineRequest(friendshipId: string) {
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
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 24 }}>Friends</Text>

      {/* Add by Yoke code */}
      <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>ADD BY YOKE CODE</Text>
      <View className="flex-row gap-2 mb-8">
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="YOKE-XXXX"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="characters"
          style={{
            flex: 1,
            backgroundColor: c.surface, color: c.textPrimary,
            borderColor: c.border, borderWidth: 1, borderRadius: 12,
            padding: 13, fontSize: 16, fontFamily: 'monospace',
          }}
        />
        <TouchableOpacity
          onPress={sendRequest}
          disabled={searching || !code.trim()}
          style={{ backgroundColor: code.trim() ? c.accent : c.border, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' }}
        >
          {searching
            ? <ActivityIndicator color="#1A1A1A" size="small" />
            : <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 15 }}>Add</Text>
          }
        </TouchableOpacity>
      </View>

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
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>Pending</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
