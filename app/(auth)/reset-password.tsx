import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  useColorScheme, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';

export default function ResetPasswordScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (password.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Password updated', 'Your password has been changed. You can now log in.', [
      { text: 'OK', onPress: () => { supabase.auth.signOut(); router.replace('/(auth)/login'); } },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 80, paddingBottom: 40 }}>
        <Text style={{ color: c.textPrimary, fontSize: 30, fontWeight: '700', marginBottom: 8 }}>
          Set new password
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 16, marginBottom: 36 }}>
          Choose a new password for your account.
        </Text>

        <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '500' }}>
          NEW PASSWORD
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor={c.textSecondary}
          secureTextEntry
          style={{
            backgroundColor: c.surface, color: c.textPrimary,
            borderColor: c.border, borderWidth: 1, borderRadius: 12,
            padding: 14, fontSize: 16, marginBottom: 16,
          }}
        />

        <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '500' }}>
          CONFIRM PASSWORD
        </Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Re-enter your password"
          placeholderTextColor={c.textSecondary}
          secureTextEntry
          style={{
            backgroundColor: c.surface, color: c.textPrimary,
            borderColor: c.border, borderWidth: 1, borderRadius: 12,
            padding: 14, fontSize: 16, marginBottom: 32,
          }}
        />

        <TouchableOpacity
          onPress={handleReset}
          disabled={loading}
          style={{ backgroundColor: c.accent, borderRadius: 14 }}
          className="py-4 items-center"
        >
          {loading
            ? <ActivityIndicator color="#1A1A1A" />
            : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Update Password</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
