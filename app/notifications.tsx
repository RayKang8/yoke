import { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors } from '../constants/theme';
import { useNotifications, AppNotification } from '../hooks/useNotifications';

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function notificationText(n: AppNotification): string {
  const name = n.actor?.name ?? 'Someone';
  switch (n.type) {
    case 'friend_request': return `${name} sent you a friend request`;
    case 'friend_accepted': return `${name} accepted your friend request`;
    case 'reaction':        return `${name} reacted to your devotional`;
    case 'comment':         return `${name} commented on your devotional`;
    default:                return 'New notification';
  }
}

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { notifications, loading, fetch, markAllRead, markRead } = useNotifications();

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  function handlePress(n: AppNotification) {
    if (!n.read) markRead(n.id);
    if ((n.type === 'friend_request' || n.type === 'friend_accepted') && n.actor?.id) {
      router.push(`/user/${n.actor.id}`);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          {notifications.some(n => !n.read) && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '600' }}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginTop: 8 }}>Notifications</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 8 }}>No notifications yet</Text>
          <Text style={{ color: c.textSecondary, textAlign: 'center', fontSize: 15 }}>
            You'll see friend requests, reactions, and comments here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
          {notifications.map(n => (
            <TouchableOpacity
              key={n.id}
              onPress={() => handlePress(n)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: n.read ? 'transparent' : c.accent + '11',
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                gap: 14,
              }}
            >
              {/* Avatar */}
              <View style={{ backgroundColor: c.accent, width: 42, height: 42, borderRadius: 21 }} className="items-center justify-center flex-shrink-0">
                <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 16 }}>
                  {n.actor?.name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 21 }}>
                  <Text style={{ fontWeight: n.read ? '400' : '600' }}>
                    {notificationText(n)}
                  </Text>
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 3 }}>
                  {timeAgo(n.created_at)}
                </Text>
              </View>

              {/* Unread dot */}
              {!n.read && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
