import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  useColorScheme, Alert, ScrollView, Linking,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { BackIcon } from '../../components/icons';

const PRIVACY_URL = 'https://yokefaith.com/privacy';
const TERMS_URL   = 'https://yokefaith.com/terms';

export default function SignUpScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    await AsyncStorage.setItem('pending_email', email.trim());
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }

    // No session means email confirmation is required
    if (!data.session) {
      router.replace('/(auth)/verify-email');
      return;
    }

    router.replace('/(auth)/onboarding');
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
            Create account
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 16, marginBottom: 36 }}>
            Let's get you set up.
          </Text>

          {/* Fields */}
          <View className="gap-4">
            <View>
              <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '500' }}>
                FULL NAME
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={c.textSecondary}
                autoCapitalize="words"
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
                placeholder="At least 6 characters"
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

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            style={{ backgroundColor: c.accent, borderRadius: 14, marginTop: 32 }}
            className="py-4 items-center"
          >
            {loading
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Create Account</Text>
            }
          </TouchableOpacity>

          <Text style={{ color: c.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 }}>
            By creating an account you agree to our{' '}
            <Text style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(TERMS_URL)}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>
          </Text>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="mt-4 items-center">
            <Text style={{ color: c.textSecondary, fontSize: 15 }}>
              Already have an account? <Text style={{ color: c.accent, fontWeight: '600' }}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
