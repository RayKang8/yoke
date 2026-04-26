import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Alert, useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { computeStreak } from '../lib/utils';
import { CalendarGrid } from '../components/CalendarGrid';
import { colors } from '../constants/theme';
import { StreakIcon, BackIcon, ChevronLeftIcon, ChevronRightIcon, LockIcon, PrayIcon, AmenIcon, HitIcon } from '../components/icons';
import { usePremium } from '../hooks/usePremium';

const REACTION_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; color?: string }> }> = {
  pray: { label: 'Pray',        Icon: PrayIcon },
  amen: { label: 'Amen',        Icon: AmenIcon },
  hit:  { label: 'This hit me', Icon: HitIcon  },
};

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
  const { isPremium } = usePremium();
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [devotionalMap, setDevotionalMap] = useState<Record<string, DevotionalDay>>({});
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  const [selectedDay, setSelectedDay] = useState<DevotionalDay | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<{ verse: number; text: string }[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Free tier: only last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const lockedBefore = !isPremium
    ? `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`
    : undefined;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: devos, error: devosError } = await supabase
      .from('devotionals')
      .select('id, content, created_at, passage:passages!passage_id(date, reference, text), reactions(type)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (devosError) {
      console.error('Calendar load error:', devosError);
      Alert.alert('Error loading calendar', devosError.message);
      setLoading(false);
      return;
    }

    const dates = new Set<string>();
    const map: Record<string, DevotionalDay> = {};

    for (const d of devos ?? []) {
      // Use passage date as the canonical day — avoids timezone skew from created_at
      const date: string = (d.passage as any)?.date ?? (() => {
        const dt = new Date(d.created_at);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      })();
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
    setStreak(computeStreak([...dates]));
    setLoading(false);
  }

  async function handleDayPress(date: string) {
    if (date === 'locked') { setShowUpgrade(true); return; }
    const devo = devotionalMap[date];
    if (!devo) return;

    setSelectedDay(devo);
    setSelectedVerses([]);

    const match = devo.passage_reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
    if (!match) return;
    const book = match[1];
    const chapter = parseInt(match[2]);
    const verseStart = parseInt(match[3]);
    const verseEnd = match[4] ? parseInt(match[4]) : verseStart;

    const { data } = await supabase
      .from('bible_verses')
      .select('verse, text')
      .eq('translation', 'NIV')
      .eq('book', book)
      .eq('chapter', chapter)
      .gte('verse', verseStart)
      .lte('verse', verseEnd)
      .order('verse');

    if (data && data.length > 0) {
      setSelectedVerses(data);
    } else {
      setSelectedVerses([{ verse: 0, text: devo.passage_text }]);
    }
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
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 }}>
        <BackIcon size={16} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>Profile</Text>
      </TouchableOpacity>

      <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>Calendar</Text>

      {/* Streak */}
      <View style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, marginBottom: 24 }} className="flex-row items-center gap-3">
        <StreakIcon size={28} />
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
          <ChevronLeftIcon size={18} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600' }}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          disabled={year === today.getFullYear() && month === today.getMonth()}
          style={{ backgroundColor: c.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: c.border, opacity: (year === today.getFullYear() && month === today.getMonth()) ? 0.3 : 1 }}
        >
          <ChevronRightIcon size={18} color={c.textPrimary} />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LockIcon size={15} color={c.textPrimary} />
              <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 15 }}>Full History</Text>
            </View>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Upgrade to see all past devotionals</Text>
          </View>
          <Text style={{ color: c.accent, fontWeight: '600' }}>Upgrade</Text>
        </TouchableOpacity>
      )}

      {/* Devotional detail modal */}
      <Modal visible={!!selectedDay} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setSelectedDay(null); setSelectedVerses([]); }}>
        {selectedDay && (
          <View style={{ flex: 1, backgroundColor: c.background }}>
            <View style={{ borderBottomColor: c.border, borderBottomWidth: 1 }} className="flex-row items-center justify-between px-5 py-4">
              <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600' }}>
                {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => { setSelectedDay(null); setSelectedVerses([]); }}>
                <Text style={{ color: c.textSecondary, fontSize: 16 }}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 }}>
                <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
                  {selectedDay.passage_reference}
                </Text>
                {selectedVerses.length === 0 ? (
                  <ActivityIndicator color={c.accent} size="small" />
                ) : selectedVerses.map((v, i) => (
                  v.verse === 0
                    ? <Text key={i} style={{ color: c.textPrimary, fontSize: 15, lineHeight: 24 }}>{v.text}</Text>
                    : <View key={v.verse} className="flex-row gap-2 mb-1">
                        <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700', width: 18, paddingTop: 3 }}>{v.verse}</Text>
                        <Text style={{ flex: 1, color: c.textPrimary, fontSize: 15, lineHeight: 24 }}>{v.text}</Text>
                      </View>
                ))}
              </View>
              <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 }}>
                <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>YOUR REFLECTION</Text>
                <Text style={{ color: c.textPrimary, fontSize: 16, lineHeight: 24 }}>{selectedDay.content}</Text>
              </View>
              {selectedDay.reactions.length > 0 && (
                <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 }}>
                  <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 10 }}>REACTIONS</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedDay.reactions.map((r, i) => {
                      const cfg = REACTION_CONFIG[r.type];
                      return (
                        <View key={i} style={{ backgroundColor: c.accent + '22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          {cfg && <cfg.Icon size={14} color={c.accent} />}
                          <Text style={{ color: c.textPrimary, fontSize: 14 }}>{cfg?.label ?? r.type}</Text>
                        </View>
                      );
                    })}
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
