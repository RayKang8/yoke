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
import { useAuth } from '../hooks/useAuth';
import { registerForPushNotifications, useNotificationListener } from '../lib/notifications';
import { initRevenueCat } from '../lib/revenuecat';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { session, loading, isRecovery } = useAuth();
  const registered = useRef(false);
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
        if (isRecovery) {
          router.replace('/(auth)/reset-password');
          return;
        }
        if (!session.user.email_confirmed_at) {
          router.replace('/(auth)/verify-email');
          return;
        }
        const onboardingDone = await AsyncStorage.getItem('onboarding_done');
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
