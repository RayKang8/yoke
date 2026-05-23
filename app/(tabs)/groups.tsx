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
import { usePremium } from '../../hooks/usePremium';
import { haptics } from '../../lib/haptics';
import { GroupCard } from '../../components/GroupCard';
import { colors, fonts, shadows, radius } from '../../constants/theme';

interface PendingInvite {
  id: string;
  group_id: string;
  group_name: string;
  inviter_name: string;
}

export default function GroupsScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { groups, loading, userId, refetch } = useGroups();
  const { isPremium, recheck: recheckPremium } = usePremium();

  useFocusEffect(useCallback(() => { refetch(); recheckPremium(); loadInvites(); }, [refetch, recheckPremium]));

  async function loadInvites() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('group_invites')
      .select('id, group_id, group:groups!group_id(name), inviter:users!inviter_id(name)')
      .eq('invitee_id', user.id)
      .eq('status', 'pending');
    setPendingInvites((data ?? []).map((i: any) => ({
      id: i.id,
      group_id: i.group_id,
      group_name: i.group?.name ?? '',
      inviter_name: i.inviter?.name ?? '',
    })));
  }

  async function handleAcceptInvite(invite: PendingInvite) {
    if (!isPremium && groups.length >= 1) {
      Alert.alert(
        'Upgrade to Premium',
        'Free accounts can be in 1 group. Upgrade to Yoke Premium for unlimited groups.',
        [{ text: 'OK' }]
      );
      return;
    }
    setInviteBusy(invite.id);
    const { error } = await supabase.rpc('accept_group_invite', { p_invite_id: invite.id });
    setInviteBusy(null);
    if (error) {
      if (error.message.includes('Upgrade to Premium')) {
        Alert.alert('Upgrade to Premium', 'Free accounts can be in 1 group. Upgrade to Yoke Premium for unlimited groups.');
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    refetch();
    Alert.alert('Joined!', `You joined "${invite.group_name}".`);
  }

  async function handleDeclineInvite(inviteId: string) {
    await supabase.from('group_invites').update({ status: 'declined' }).eq('id', inviteId);
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
  }
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleCreate() {
    if (!groupName.trim()) return;

    if (!isPremium && groups.length >= 1) {
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
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id });

    if (memberError) {
      Alert.alert('Error', memberError.message ?? 'Could not add you to the group.');
      setBusy(false);
      return;
    }

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

    if (!isPremium && groups.length >= 1) {
      Alert.alert(
        'Upgrade to Premium',
        'Free accounts can be in 1 group. Upgrade to Yoke Premium for unlimited groups.',
        [{ text: 'OK' }]
      );
      return;
    }

    setBusy(true);

    const { data, error } = await supabase.rpc('join_group_by_invite', { p_invite_code: code });

    setBusy(false);

    if (error) {
      if (error.message.includes('Invalid invite code')) {
        Alert.alert('Invalid code', 'No group found with that invite code.');
      } else if (error.message.includes('Already a member')) {
        Alert.alert('Already a member', "You're already in this group.");
      } else if (error.message.includes('Upgrade to Premium')) {
        Alert.alert('Upgrade to Premium', 'Free accounts can be in 1 group. Upgrade to Yoke Premium for unlimited groups.');
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }

    setShowJoin(false);
    setInviteCode('');
    haptics.success();
    refetch();
    Alert.alert('Joined!', `You joined "${(data as any)?.group_name ?? 'the group'}".`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.accent} />}
      >
        <Text style={{ color: c.textPrimary, fontFamily: fonts.heading, fontSize: 26, marginBottom: 20 }}>Groups</Text>

        {pendingInvites.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: c.textSecondary, fontFamily: fonts.uiMedium, fontSize: 11, letterSpacing: 0.6, marginBottom: 10 }}>
              PENDING INVITES
            </Text>
            {pendingInvites.map(invite => (
              <View
                key={invite.id}
                style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.warmBorder, padding: 16, marginBottom: 10 }}
              >
                <Text style={{ color: c.textPrimary, fontFamily: fonts.uiBold, fontSize: 16, marginBottom: 2 }}>
                  {invite.group_name}
                </Text>
                <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 13, marginBottom: 14 }}>
                  Invited by {invite.inviter_name}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleDeclineInvite(invite.id)}
                    disabled={inviteBusy === invite.id}
                    style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ color: c.textSecondary, fontFamily: fonts.uiMedium, fontSize: 14 }}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAcceptInvite(invite)}
                    disabled={inviteBusy === invite.id}
                    style={{ flex: 1, borderRadius: 10, backgroundColor: c.accent, paddingVertical: 10, alignItems: 'center' }}
                  >
                    {inviteBusy === invite.id
                      ? <ActivityIndicator color="#1A1A1A" size="small" />
                      : <Text style={{ color: '#1A1A1A', fontFamily: fonts.uiBold, fontSize: 14 }}>Accept</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

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
              isPremium={isPremium}
              onPress={() => router.push(`/group/${g.id}`)}
            />
          ))
        )}

        {/* Action buttons */}
        <View className="gap-3 mt-4">
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={{ backgroundColor: c.accent, borderRadius: radius.md, ...shadows.sm }}
            className="py-4 items-center"
          >
            <Text style={{ color: '#1A1A1A', fontFamily: fonts.uiBold, fontSize: 16 }}>+ Create Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowJoin(true)}
            style={{ backgroundColor: c.warmSurface, borderRadius: radius.md, borderWidth: 1, borderColor: c.warmBorder }}
            className="py-4 items-center"
          >
            <Text style={{ color: c.textPrimary, fontFamily: fonts.ui, fontSize: 16 }}>Join with Invite Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 24, paddingTop: 32 }}>
          <View className="flex-row items-center justify-between mb-8">
            <Text style={{ color: c.textPrimary, fontFamily: fonts.heading, fontSize: 22 }}>Create Group</Text>
            <TouchableOpacity onPress={() => { setShowCreate(false); setGroupName(''); }}>
              <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: c.textSecondary, fontFamily: fonts.uiMedium, fontSize: 11, letterSpacing: 0.6, marginBottom: 6 }}>GROUP NAME</Text>
          <TextInput
            value={groupName}
            onChangeText={t => setGroupName(t.slice(0, 100))}
            placeholder="e.g. Sunday Small Group"
            placeholderTextColor={c.textSecondary}
            maxLength={100}
            style={{
              backgroundColor: c.warmSurface, color: c.textPrimary,
              borderColor: c.warmBorder, borderWidth: 1, borderRadius: radius.md,
              padding: 16, fontFamily: fonts.uiRegular, fontSize: 16, marginBottom: 32,
            }}
          />

          <TouchableOpacity
            onPress={handleCreate}
            disabled={busy || !groupName.trim()}
            style={{ backgroundColor: groupName.trim() ? c.accent : c.border, borderRadius: radius.md }}
            className="py-4 items-center"
          >
            {busy
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={{ color: '#1A1A1A', fontFamily: fonts.uiBold, fontSize: 17 }}>Create Group</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={showJoin} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowJoin(false)}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 24, paddingTop: 32 }}>
          <View className="flex-row items-center justify-between mb-8">
            <Text style={{ color: c.textPrimary, fontFamily: fonts.heading, fontSize: 22 }}>Join Group</Text>
            <TouchableOpacity onPress={() => { setShowJoin(false); setInviteCode(''); }}>
              <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: c.textSecondary, fontFamily: fonts.uiMedium, fontSize: 11, letterSpacing: 0.6, marginBottom: 6 }}>INVITE CODE</Text>
          <TextInput
            value={inviteCode}
            onChangeText={t => setInviteCode(t.slice(0, 20))}
            placeholder="e.g. YK-X7K2A3"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="characters"
            maxLength={20}
            style={{
              backgroundColor: c.warmSurface, color: c.textPrimary,
              borderColor: c.warmBorder, borderWidth: 1, borderRadius: radius.md,
              padding: 16, fontSize: 16, marginBottom: 32,
              fontFamily: 'monospace',
            }}
          />

          <TouchableOpacity
            onPress={handleJoin}
            disabled={busy || !inviteCode.trim()}
            style={{ backgroundColor: inviteCode.trim() ? c.accent : c.border, borderRadius: radius.md }}
            className="py-4 items-center"
          >
            {busy
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={{ color: '#1A1A1A', fontFamily: fonts.uiBold, fontSize: 17 }}>Join Group</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
