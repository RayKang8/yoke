import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { EmailIcon } from '../../components/icons';

export default function VerifyEmailScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  // If the user taps the email link and the app opens via deep link,
  // Supabase fires SIGNED_IN with email_confirmed_at set — auto-advance.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'USER_UPDATED') &&
        session?.user?.email_confirmed_at
      ) {
        router.replace('/(auth)/onboarding');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleCheckConfirmed() {
    setChecking(true);
    // Re-fetch the user to see if they've confirmed since this screen opened
    const { data: { user } } = await supabase.auth.getUser();
    setChecking(false);

    if (user?.email_confirmed_at) {
      router.replace('/(auth)/onboarding');
    } else {
      Alert.alert(
        'Not confirmed yet',
        "Your email hasn't been confirmed. Check your inbox and tap the link, then come back here.",
      );
    }
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
      <EmailIcon size={64} color={c.accent} />
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
