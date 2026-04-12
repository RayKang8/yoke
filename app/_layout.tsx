import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { registerForPushNotifications, useNotificationListener } from '../lib/notifications';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/(tabs)');
      // Register for push once per session
      if (!registered.current) {
        registered.current = true;
        registerForPushNotifications();
      }
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [session, loading]);

  // Handle notification taps — deep link to the right screen
  useNotificationListener((data) => {
    if (data.screen === 'home') router.push('/(tabs)');
    else if (data.screen === 'profile' && data.userId) router.push(`/user/${data.userId}`);
  });

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
