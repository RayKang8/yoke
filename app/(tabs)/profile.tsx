import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top + 16 }} className="px-6">
      <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 24 }}>Profile</Text>

      <TouchableOpacity
        onPress={() => router.push('/friends')}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12 }}
        className="flex-row items-center justify-between"
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>👥  Friends</Text>
        <Text style={{ color: c.textSecondary }}>›</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        onPress={handleLogout}
        style={{ borderColor: c.border, borderWidth: 1, borderRadius: 14, marginBottom: 24 }}
        className="py-4 items-center"
      >
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
