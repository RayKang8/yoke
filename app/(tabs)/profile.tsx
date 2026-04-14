import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, useColorScheme,
  Clipboard, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useProfile } from '../../hooks/useProfile';
import { colors } from '../../constants/theme';
import { CalendarIcon, FriendsIcon, SettingsIcon } from '../../components/icons';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { profile, devoCount, friendCount, loading, refetch, updateProfile } = useProfile();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editChurch, setEditChurch] = useState('');
  const [saving, setSaving] = useState(false);

  function openEdit() {
    setEditName(profile?.name ?? '');
    setEditBio(profile?.bio ?? '');
    setEditChurch(profile?.church ?? '');
    setEditVisible(true);
  }

  async function saveEdit() {
    setSaving(true);
    await updateProfile({
      name: editName.trim(),
      bio: editBio.trim().slice(0, 100),
      church: editChurch.trim(),
    });
    setSaving(false);
    setEditVisible(false);
  }

  function copyYokeCode() {
    if (!profile?.yoke_code) return;
    Clipboard.setString(profile.yoke_code);
    Alert.alert('Copied!', `${profile.yoke_code} copied to clipboard.`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center">
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  const initials = profile?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 40 }}
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-6">
        <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700' }}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}
          style={{ backgroundColor: c.surface, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: c.border }}
        >
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + name */}
      <View className="items-center mb-6">
        <View style={{ backgroundColor: c.accent, width: 80, height: 80, borderRadius: 40 }} className="items-center justify-center mb-3">
          <Text style={{ color: '#1A1A1A', fontSize: 30, fontWeight: '700' }}>{initials}</Text>
        </View>
        <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 2 }}>
          {profile?.name}
        </Text>

        {/* Yoke code — tap to copy */}
        <TouchableOpacity onPress={copyYokeCode}
          style={{ backgroundColor: c.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: c.border, marginBottom: 6 }}
        >
          <Text style={{ color: c.accent, fontWeight: '600', fontSize: 15, letterSpacing: 1 }}>
            {profile?.yoke_code}
          </Text>
        </TouchableOpacity>

        {profile?.bio && (
          <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
            {profile.bio}
          </Text>
        )}
        {profile?.church && (
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>⛪ {profile.church}</Text>
        )}

        <TouchableOpacity onPress={openEdit}
          style={{ marginTop: 12, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7 }}
        >
          <Text style={{ color: c.textSecondary, fontSize: 14 }}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View className="flex-row gap-3 mb-6">
        {[
          { label: 'Devotionals', value: devoCount, accent: false },
          { label: 'Day Streak', value: profile?.streak ?? 0, accent: true },
          { label: 'Friends', value: friendCount, accent: false },
        ].map(stat => (
          <View key={stat.label}
            style={{ flex: 1, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14 }}
            className="items-center"
          >
            <Text style={{ color: stat.accent ? c.accent : c.textPrimary, fontSize: 24, fontWeight: '700' }}>
              {stat.value}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      {([
        { label: 'View Calendar', route: '/calendar',  Icon: CalendarIcon },
        { label: 'Friends',       route: '/friends',   Icon: FriendsIcon  },
        { label: 'Settings',      route: '/settings',  Icon: SettingsIcon },
      ] as const).map(({ label, route, Icon }) => (
        <TouchableOpacity key={route} onPress={() => router.push(route as any)}
          style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 }}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <Icon size={20} color={c.accent} />
            <Text style={{ color: c.textPrimary, fontSize: 16 }}>{label}</Text>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout}
        style={{ borderColor: c.border, borderWidth: 1, borderRadius: 14, marginTop: 16 }}
        className="py-4 items-center"
      >
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>Log out</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditVisible(false)}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 24, paddingTop: 32 }}>
          <View className="flex-row items-center justify-between mb-8">
            <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700' }}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={{ color: c.textSecondary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {[
            { label: 'NAME', value: editName, set: setEditName, placeholder: 'Your name', max: 50 },
            { label: 'BIO', value: editBio, set: setEditBio, placeholder: 'Short bio (100 chars max)', max: 100 },
            { label: 'CHURCH', value: editChurch, set: setEditChurch, placeholder: 'Your church (optional)', max: 80 },
          ].map(field => (
            <View key={field.label} className="mb-4">
              <View className="flex-row justify-between mb-1">
                <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600' }}>{field.label}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>{field.value.length}/{field.max}</Text>
              </View>
              <TextInput
                value={field.value}
                onChangeText={t => field.set(t.slice(0, field.max))}
                placeholder={field.placeholder}
                placeholderTextColor={c.textSecondary}
                style={{
                  backgroundColor: c.surface, color: c.textPrimary,
                  borderColor: c.border, borderWidth: 1, borderRadius: 12,
                  padding: 13, fontSize: 16,
                }}
              />
            </View>
          ))}

          <TouchableOpacity onPress={saveEdit} disabled={saving || !editName.trim()}
            style={{ backgroundColor: editName.trim() ? c.accent : c.border, borderRadius: 14, marginTop: 8 }}
            className="py-4 items-center"
          >
            {saving
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Save</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}
