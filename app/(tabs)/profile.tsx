import { View, Text, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center px-8">
      <Text style={{ color: c.textPrimary, fontSize: 20, fontWeight: '600' }}>Profile</Text>
      <Text style={{ color: c.textSecondary, marginTop: 8, marginBottom: 32 }}>Coming in Step 9</Text>
      <TouchableOpacity
        onPress={handleLogout}
        style={{ borderColor: c.border, borderWidth: 1, borderRadius: 12 }}
        className="px-8 py-3"
      >
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
