import { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { EmailIcon } from '../../components/icons';

export default function VerifyEmailScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [resending, setResending] = useState(false);

  async function handleCheckConfirmed() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
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
        style={{ backgroundColor: c.accent, borderRadius: 14, width: '100%' }}
        className="py-4 items-center mb-4"
      >
        <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>I've confirmed my email</Text>
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
