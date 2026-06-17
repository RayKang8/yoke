import '../global.css';
import { useEffect, useRef } from 'react';
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
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications, useNotificationListener } from '../lib/notifications';
import { initRevenueCat } from '../lib/revenuecat';
import { initPostHog, analytics } from '../lib/posthog';
import AppSplash from '../components/AppSplash';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, loading, isRecovery } = useAuth();
  const registered = useRef(false);

  useEffect(() => { initPostHog(); }, []);

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

  // Hide the native splash immediately on first render — our AppSplash takes over
  // from here and stays until fonts and auth are both ready.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

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

useNotificationListener((data) => {
    if (data.screen === 'home') router.push('/(tabs)');
    else if (data.screen === 'groups') router.push('/(tabs)/groups' as any);
    else if (data.screen === 'profile' && data.userId) router.push(`/user/${data.userId}` as any);
  });

  if (loading || !fontsLoaded) {
    return <AppSplash />;
  }

  // Key forces a full navigator remount when the user changes (e.g. delete +
  // re-register with same email), preventing stale cached tab screen state.
  const userId = session?.user?.id ?? 'guest';

  return (
    <SafeAreaProvider>
      <Stack key={userId} screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
