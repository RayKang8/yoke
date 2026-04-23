import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, ActivityIndicator, Alert, useColorScheme,
  Share, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useGroups } from '../../hooks/useGroups';
import { haptics } from '../../lib/haptics';
import { GroupCard } from '../../components/GroupCard';
import { colors } from '../../constants/theme';

export default function GroupsScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { groups, loading, userId, refetch } = useGroups();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleCreate() {
    if (!groupName.trim()) return;

    // Free tier: max 1 group
    if (groups.length >= 1) {
      Alert.alert(
        'Upgrade to Premium',
        'Free accounts can join 1 group. Upgrade to Yoke Premium for unlimited groups.',
        [{ text: 'OK' }]
      );
      return;
    }

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }

    // Generate invite code via DB function
    const { data: codeData } = await supabase.rpc('generate_invite_code');
    const invite_code = codeData as string;

    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), created_by: user.id, invite_code })
      .select()
      .single();

    if (error || !group) {
      Alert.alert('Error', error?.message ?? 'Could not create group.');
      setBusy(false);
      return;
    }

    // Add creator as member
    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });

    setBusy(false);
    setShowCreate(false);
    setGroupName('');
    haptics.success();
    refetch();

    // Share invite code
    Share.share({
      message: `Join my Yoke group "${group.name}"! Use invite code: ${invite_code}`,
    });
  }

  async function handleJoin() {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;

    if (groups.length >= 1) {
      Alert.alert(
        'Upgrade to Premium',
        'Free accounts can be in 1 group. Upgrade to Yoke Premium for unlimited groups.',
        [{ text: 'OK' }]
      );
      return;
    }

    setBusy(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }

    const { data: group, error } = await supabase
      .from('groups')
      .select('id, name')
      .eq('invite_code', code)
      .maybeSingle();

    if (error || !group) {
      Alert.alert('Invalid code', 'No group found with that invite code.');
      setBusy(false);
      return;
    }

    // Check already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      Alert.alert('Already a member', `You're already in "${group.name}".`);
      setBusy(false);
      setShowJoin(false);
      setInviteCode('');
      return;
    }

    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });

    setBusy(false);
    setShowJoin(false);
    setInviteCode('');
    haptics.success();
    refetch();
    Alert.alert('Joined!', `You joined "${group.name}".`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
      >
        <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 20 }}>Groups</Text>

        {loading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
        ) : groups.length === 0 ? (
          <View className="items-center pt-16 pb-8">
            <Text style={{ color: c.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No groups yet</Text>
            <Text style={{ color: c.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
              Create a group with your friends or small group, or join one with an invite code.
            </Text>
          </View>
        ) : (
          groups.map(g => (
            <GroupCard
              key={g.id}
              group={g}
              onPress={() => router.push(`/group/${g.id}`)}
            />
          ))
        )}

        {/* Action buttons */}
        <View className="gap-3 mt-4">
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={{ backgroundColor: c.accent, borderRadius: 14 }}
            className="py-4 items-center"
          >
            <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '600' }}>+ Create Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowJoin(true)}
            style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border }}
            className="py-4 items-center"
          >
            <Text style={{ color: c.textPrimary, fontSize: 16, fontWeight: '500' }}>Join with Invite Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 24, paddingTop: 32 }}>
          <View className="flex-row items-center justify-between mb-8">
            <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700' }}>Create Group</Text>
            <TouchableOpacity onPress={() => { setShowCreate(false); setGroupName(''); }}>
              <Text style={{ color: c.textSecondary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 6 }}>GROUP NAME</Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="e.g. Sunday Small Group"
            placeholderTextColor={c.textSecondary}
            style={{
              backgroundColor: c.surface, color: c.textPrimary,
              borderColor: c.border, borderWidth: 1, borderRadius: 12,
              padding: 14, fontSize: 16, marginBottom: 32,
            }}
          />

          <TouchableOpacity
            onPress={handleCreate}
            disabled={busy || !groupName.trim()}
            style={{ backgroundColor: groupName.trim() ? c.accent : c.border, borderRadius: 14 }}
            className="py-4 items-center"
          >
            {busy
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Create Group</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={showJoin} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowJoin(false)}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 24, paddingTop: 32 }}>
          <View className="flex-row items-center justify-between mb-8">
            <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700' }}>Join Group</Text>
            <TouchableOpacity onPress={() => { setShowJoin(false); setInviteCode(''); }}>
              <Text style={{ color: c.textSecondary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 6 }}>INVITE CODE</Text>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="e.g. YK-X7K2A3"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="characters"
            style={{
              backgroundColor: c.surface, color: c.textPrimary,
              borderColor: c.border, borderWidth: 1, borderRadius: 12,
              padding: 14, fontSize: 16, marginBottom: 32,
              fontFamily: 'monospace',
            }}
          />

          <TouchableOpacity
            onPress={handleJoin}
            disabled={busy || !inviteCode.trim()}
            style={{ backgroundColor: inviteCode.trim() ? c.accent : c.border, borderRadius: 14 }}
            className="py-4 items-center"
          >
            {busy
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Join Group</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
