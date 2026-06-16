import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

// How notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Permission + token registration ────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Simulator — local notifications still work, push tokens won't
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }

  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    // Save token to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('users').update({ push_token: token }).eq('id', user.id);
    }
    return token;
  } catch {
    // Falls through in Expo Go where no projectId is available
    return null;
  }
}

// ── Daily reminder scheduling ───────────────────────────────

/**
 * Parses "8:00 AM" → { hour: 8, minute: 0 }
 */
function parseTime(timeStr: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 8, minute: 0 };
  const [time, period] = timeStr.split(' ');
  let [hour, minute] = (time ?? '8:00').split(':').map(Number);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

export async function scheduleDailyReminder(timeStr: string, passageReference?: string) {
  // Cancel any existing daily reminder
  await cancelDailyReminder();

  const { hour, minute } = parseTime(timeStr);

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title: 'Yoke',
      body: passageReference
        ? `${passageReference} — Today's passage is ready. Open Yoke.`
        : "Today's passage is ready. Open Yoke.",
      data: { screen: 'home' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync('daily-reminder').catch(() => {});
}

// ── Push notification to another user ──────────────────────

export async function sendPushToUser(userId: string, title: string, body: string, data?: Record<string, unknown>) {
  // Fetch recipient's push token
  const { data: user } = await supabase
    .from('users')
    .select('push_token')
    .eq('id', userId)
    .single();

  if (!user?.push_token) return; // user hasn't granted permission

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.push_token,
        title,
        body,
        data: data ?? {},
        sound: 'default',
      }),
    });
  } catch {
    // Non-critical — push delivery failure should not surface to the user
  }
}

// ── Notification tap handler ────────────────────────────────

export function useNotificationListener(onTap: (data: Record<string, unknown>) => void) {
  const onTapRef = useRef(onTap);
  useEffect(() => { onTapRef.current = onTap; });

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      onTapRef.current(data);
    });
    return () => subscription.remove();
  }, []);
}
