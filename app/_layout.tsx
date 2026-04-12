import '../global.css';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { registerForPushNotifications, useNotificationListener } from '../lib/notifications';
import { initRevenueCat } from '../lib/revenuecat';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const registered = useRef(false);
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/(tabs)');
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
