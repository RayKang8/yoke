import { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';

export default function VerifyEmailScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleCheckConfirmed() {
    setChecking(true);
    // Try to refresh session — works if user has an unconfirmed session
    const { data: refreshData } = await supabase.auth.refreshSession();
    if (refreshData.session?.user?.email_confirmed_at) {
      setChecking(false);
      router.replace('/(auth)/onboarding');
      return;
    }
    // No session at all (signUp returned null session) — prompt them to log in
    const { data: sessionData } = await supabase.auth.getSession();
    setChecking(false);
    if (!sessionData.session) {
      Alert.alert(
        'Not confirmed yet',
        'Once you tap the link in your email, come back and log in.',
        [{ text: 'Go to Login', onPress: () => router.replace('/(auth)/login') }]
      );
      return;
    }
    Alert.alert('Not confirmed yet', 'Tap the link in your email, then try again.');
  }

  async function handleResend() {
    const email = await AsyncStorage.getItem('pending_email');
    if (!email) {
      Alert.alert('Error', 'Could not find your email. Please sign up again.');
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Sent', 'Confirmation email resent. Check your inbox.');
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }} className="px-8 pt-20 pb-12 items-center">
      <Text style={{ fontSize: 64, marginBottom: 24 }}>📧</Text>
      <Text style={{ color: c.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
        Check your email
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 48 }}>
        We sent a confirmation link to your email. Tap it to activate your account, then come back here.
      </Text>

      <TouchableOpacity
        onPress={handleCheckConfirmed}
        disabled={checking}
        style={{ backgroundColor: c.accent, borderRadius: 14, width: '100%' }}
        className="py-4 items-center mb-4"
      >
        {checking
          ? <ActivityIndicator color="#1A1A1A" />
          : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>I've confirmed my email</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResend}
        disabled={resending}
        className="py-3 items-center"
      >
        {resending
          ? <ActivityIndicator color={c.textSecondary} size="small" />
          : <Text style={{ color: c.textSecondary, fontSize: 15 }}>Resend confirmation email</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => { supabase.auth.signOut(); router.replace('/(auth)/welcome'); }}
        className="mt-4 py-3 items-center"
      >
        <Text style={{ color: c.textSecondary, fontSize: 15 }}>Use a different account</Text>
      </TouchableOpacity>
    </View>
  );
}
