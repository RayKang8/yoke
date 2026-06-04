import '../global.css';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import * as Linking from 'expo-linking';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications, useNotificationListener } from '../lib/notifications';
import { initRevenueCat } from '../lib/revenuecat';
import { initPostHog, analytics } from '../lib/posthog';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { session, loading, isRecovery } = useAuth();
  const registered = useRef(false);

  useEffect(() => { initPostHog(); }, []);
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    Lora_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (loading) return;
    (async () => {
      if (session) {
        analytics.identify(session.user.id, {
          email: session.user.email ?? null,
          name: session.user.user_metadata?.name ?? null,
        });
        if (isRecovery) {
          router.replace('/(auth)/reset-password');
          return;
        }
        if (!session.user.email_confirmed_at) {
          router.replace('/(auth)/verify-email');
          return;
        }
        // Use per-user key so a deleted+recreated account (new UUID) always sees onboarding.
        // Fall back to the legacy global key so existing users aren't shown it again.
        const [[, perUserDone], [, legacyDone]] = await AsyncStorage.multiGet([
          `onboarding_done_${session.user.id}`,
          'onboarding_done',
        ]);
        const onboardingDone = perUserDone ?? legacyDone;
        if (!onboardingDone) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)');
        }
        if (!registered.current) {
          registered.current = true;
          registerForPushNotifications();
          initRevenueCat(session.user.id);
        }
      } else {
        router.replace('/(auth)/welcome');
      }
    })();
  }, [session, loading, isRecovery]);

  // Handle deep links for email confirmation and password reset (PKCE flow)
  useEffect(() => {
    async function handleUrl(url: string) {
      if (!url?.includes('code=')) return;
      await supabase.auth.exchangeCodeForSession(url);
      // onAuthStateChange fires automatically; _layout routing effect handles navigation
    }
    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  useNotificationListener((data) => {
    if (data.screen === 'home') router.push('/(tabs)');
    else if (data.screen === 'groups') router.push('/(tabs)/groups' as any);
    else if (data.screen === 'profile' && data.userId) router.push(`/user/${data.userId}` as any);
  });

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.accent} size="large" />
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
