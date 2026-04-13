import '../global.css';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useAuth } from '../hooks/useAuth';
import { registerForPushNotifications, useNotificationListener } from '../lib/notifications';
import { initRevenueCat } from '../lib/revenuecat';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const registered = useRef(false);
  const pendingRoute = useRef<string | null>(null);
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  // Handle deep link from email confirmation
  useEffect(() => {
    async function handleUrl(url: string) {
      const hash = url.split('#')[1];
      if (!hash) return;
      const params = Object.fromEntries(new URLSearchParams(hash));
      if (params.access_token && params.refresh_token) {
        if (params.type === 'signup') pendingRoute.current = '/(auth)/onboarding';
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      }
    }

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (session) {
      if (!session.user.email_confirmed_at) {
        router.replace('/(auth)/verify-email');
        return;
      }
      const route = pendingRoute.current ?? '/(tabs)';
      pendingRoute.current = null;
      router.replace(route as any);
      if (!registered.current) {
        registered.current = true;
        registerForPushNotifications();
        initRevenueCat(session.user.id);
      }
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [session, loading]);

  useNotificationListener((data) => {
    if (data.screen === 'home') router.push('/(tabs)');
    else if (data.screen === 'profile' && data.userId) router.push(`/user/${data.userId}` as any);
  });

  if (loading) {
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
