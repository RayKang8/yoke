import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useFeed } from '../../hooks/useFeed';
import { usePremium } from '../../hooks/usePremium';
import { DevotionalCard } from '../../components/DevotionalCard';
import { colors } from '../../constants/theme';

type Tab = 'public' | 'friends';

export default function FeedScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('public');
  const [currentUserId, setCurrentUserId] = useState('');

  const { items, loading, refreshing, loadingMore, hasMore, error, refresh, loadMore } = useFeed(tab);
  const { isPremium } = usePremium();

  // Mutate reactions locally so the UI updates instantly
  const [localItems, setLocalItems] = useState(items);
  useEffect(() => { setLocalItems(items); }, [items]);

  function handleReactionUpdate(id: string, reactions: { type: string; user_id: string }[]) {
    setLocalItems(prev => prev.map(item => item.id === id ? { ...item, reactions } : item));
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 0, backgroundColor: c.background }}>
        <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 14 }}>Feed</Text>

        {/* Tab switcher */}
        <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: c.border, marginBottom: 12 }}>
          {(['public', 'friends'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: tab === t ? c.accent : 'transparent',
              }}
            >
              <Text style={{
                color: tab === t ? '#1A1A1A' : c.textSecondary,
                fontWeight: tab === t ? '600' : '400',
                fontSize: 14,
              }}>
                {t === 'public' ? 'Public' : 'Friends'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ color: c.textSecondary, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
          <TouchableOpacity onPress={refresh}
            style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={localItems}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-20 px-8">
              <Text style={{ color: c.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                {tab === 'public' ? 'No public posts yet' : 'No posts from friends yet'}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
                {tab === 'public'
                  ? 'Be the first to post a public devotional today.'
                  : "Your friends haven't shared any devotionals yet. Find more friends on the Friends screen to grow your feed."
                }
              </Text>
            </View>
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <DevotionalCard
              item={item}
              currentUserId={currentUserId}
              isPremium={isPremium}
              onReactionUpdate={handleReactionUpdate}
            />
          )}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={c.accent} style={{ marginVertical: 20 }} />
            ) : hasMore ? (
              <TouchableOpacity
                onPress={loadMore}
                style={{ alignItems: 'center', paddingVertical: 20 }}
              >
                <Text style={{ color: c.accent, fontWeight: '600', fontSize: 15 }}>Load more</Text>
              </TouchableOpacity>
            ) : items.length > 0 ? (
              <Text style={{ color: c.textSecondary, textAlign: 'center', fontSize: 13, paddingVertical: 20 }}>
                You're all caught up
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}
