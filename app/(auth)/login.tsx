import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  useColorScheme, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { BackIcon } from '../../components/icons';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Login failed', error.message);
      return;
    }

    if (!data.session?.user?.email_confirmed_at) {
      router.replace('/(auth)/verify-email');
      return;
    }
    // _layout.tsx handles routing to tabs/onboarding on session change
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Type your email above, then tap Forgot Password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'yoke://(auth)/reset-password',
    });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Check your email',
        'A password reset link has been sent. Tap the link in your email — it will reopen Yoke so you can set a new password.',
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-8 pt-16 pb-10">
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 40 }}>
            <BackIcon size={16} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ color: c.textPrimary, fontSize: 30, fontWeight: '700', marginBottom: 8 }}>
            Welcome back
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 16, marginBottom: 36 }}>
            Sign in to continue your streak.
          </Text>

          {/* Fields */}
          <View className="gap-4">
            <View>
              <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '500' }}>
                EMAIL
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={c.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{
                  backgroundColor: c.surface,
                  color: c.textPrimary,
                  borderColor: c.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                }}
              />
            </View>

            <View>
              <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '500' }}>
                PASSWORD
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={c.textSecondary}
                secureTextEntry
                style={{
                  backgroundColor: c.surface,
                  color: c.textPrimary,
                  borderColor: c.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                }}
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleForgotPassword} className="mt-3 items-end">
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{ backgroundColor: c.accent, borderRadius: 14, marginTop: 28 }}
            className="py-4 items-center"
          >
            {loading
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Log In</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} className="mt-6 items-center">
            <Text style={{ color: c.textSecondary, fontSize: 15 }}>
              Don't have an account? <Text style={{ color: c.accent, fontWeight: '600' }}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
