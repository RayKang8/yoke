import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { CalendarGrid } from '../components/CalendarGrid';
import { colors } from '../constants/theme';

interface DevotionalDay {
  date: string;
  content: string;
  passage_reference: string;
  passage_text: string;
  reactions: { type: string }[];
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [devotionalMap, setDevotionalMap] = useState<Record<string, DevotionalDay>>({});
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [streak, setStreak] = useState(0);

  const [selectedDay, setSelectedDay] = useState<DevotionalDay | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Free tier: only last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const lockedBefore = !isPremium
    ? `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`
    : undefined;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: profile }, { data: devos }] = await Promise.all([
      supabase.from('users').select('is_premium, trial_ends_at, streak').eq('id', user.id).single(),
      supabase
        .from('devotionals')
        .select('id, content, created_at, passage:passages!passage_id(reference, text), reactions(type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const premium = profile?.is_premium || (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date());
    setIsPremium(!!premium);
    setStreak(profile?.streak ?? 0);

    const dates = new Set<string>();
    const map: Record<string, DevotionalDay> = {};

    for (const d of devos ?? []) {
      const date = d.created_at.slice(0, 10);
      dates.add(date);
      map[date] = {
        date,
        content: d.content,
        passage_reference: (d.passage as any)?.reference ?? '',
        passage_text: (d.passage as any)?.text ?? '',
        reactions: d.reactions ?? [],
      };
    }

    setCompletedDates(dates);
    setDevotionalMap(map);
    setLoading(false);
  }

  function handleDayPress(date: string) {
    if (date === 'locked') { setShowUpgrade(true); return; }
    const devo = devotionalMap[date];
    if (devo) setSelectedDay(devo);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const reactionLabels: Record<string, string> = { pray: '🙏 Pray', amen: '✝ Amen', hit: '💛 This hit me' };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center">
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40 }}
    >
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>← Profile</Text>
      </TouchableOpacity>

      <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>Calendar</Text>

      {/* Streak */}
      <View style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, marginBottom: 24 }} className="flex-row items-center gap-3">
        <Text style={{ fontSize: 28 }}>🔥</Text>
        <View>
          <Text style={{ color: '#1A1A1A', fontSize: 20, fontWeight: '700' }}>{streak} day streak</Text>
          <Text style={{ color: '#1A1A1A', fontSize: 14 }}>Keep it going!</Text>
        </View>
      </View>

      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={prevMonth}
          style={{ backgroundColor: c.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: c.border }}
        >
          <Text style={{ color: c.textPrimary, fontSize: 16 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600' }}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          disabled={year === today.getFullYear() && month === today.getMonth()}
          style={{ backgroundColor: c.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: c.border, opacity: (year === today.getFullYear() && month === today.getMonth()) ? 0.3 : 1 }}
        >
          <Text style={{ color: c.textPrimary, fontSize: 16 }}>›</Text>
        </TouchableOpacity>
      </View>

      <CalendarGrid
        year={year}
        month={month}
        completedDates={completedDates}
        lockedBefore={lockedBefore}
        onDayPress={handleDayPress}
      />

      {!isPremium && (
        <TouchableOpacity onPress={() => setShowUpgrade(true)}
          style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginTop: 20 }}
          className="flex-row items-center justify-between"
        >
          <View>
            <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 15 }}>🔒 Full History</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Upgrade to see all past devotionals</Text>
          </View>
          <Text style={{ color: c.accent, fontWeight: '600' }}>Upgrade</Text>
        </TouchableOpacity>
      )}

      {/* Devotional detail modal */}
      <Modal visible={!!selectedDay} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedDay(null)}>
        {selectedDay && (
          <View style={{ flex: 1, backgroundColor: c.background }}>
            <View style={{ borderBottomColor: c.border, borderBottomWidth: 1 }} className="flex-row items-center justify-between px-5 py-4">
              <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600' }}>
                {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Text style={{ color: c.textSecondary, fontSize: 16 }}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 }}>
                <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
                  {selectedDay.passage_reference}
                </Text>
                <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 24 }}>
                  {selectedDay.passage_text}
                </Text>
              </View>
              <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 }}>
                <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>YOUR REFLECTION</Text>
                <Text style={{ color: c.textPrimary, fontSize: 16, lineHeight: 24 }}>{selectedDay.content}</Text>
              </View>
              {selectedDay.reactions.length > 0 && (
                <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 }}>
                  <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 10 }}>REACTIONS</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedDay.reactions.map((r, i) => (
                      <View key={i} style={{ backgroundColor: c.accent + '22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                        <Text style={{ color: c.textPrimary, fontSize: 14 }}>{reactionLabels[r.type] ?? r.type}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Upgrade prompt modal */}
      <Modal visible={showUpgrade} transparent animationType="fade" onRequestClose={() => setShowUpgrade(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowUpgrade(false)}>
          <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: insets.bottom + 28 }}>
            <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Unlock Full History</Text>
            <Text style={{ color: c.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 24 }}>
              Upgrade to Yoke Premium to see your complete devotional history — every day you've ever posted.
            </Text>
            <TouchableOpacity
              onPress={() => { setShowUpgrade(false); router.push('/settings'); }}
              style={{ backgroundColor: c.accent, borderRadius: 14 }}
              className="py-4 items-center"
            >
              <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
