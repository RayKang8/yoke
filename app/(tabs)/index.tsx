import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, useColorScheme, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { usePassage } from '../../hooks/usePassage';
import { colors } from '../../constants/theme';
import { haptics } from '../../lib/haptics';
import { Translation, Visibility } from '../../types';
import { StreakIcon } from '../../components/icons';

const TRANSLATIONS: Translation[] = ['NIV', 'ESV', 'KJV', 'NLT', 'NKJV', 'BSB', 'ASV', 'WEB', 'YLT'];
const VISIBILITIES: { value: Visibility; label: string }[] = [
  { value: 'friends', label: 'Friends Only' },
  { value: 'public', label: 'Public' },
];


function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const { passage, todaysDevotion, loading, error, setTodaysDevotion } = usePassage();

  const [translation, setTranslation] = useState<Translation>('NIV');
  const [passageVerses, setPassageVerses] = useState<{ verse: number; text: string }[]>([]);
  const [reflection, setReflection] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [posting, setPosting] = useState(false);
  const [streak, setStreak] = useState(0);

  // Edit state
  const [editVisible, setEditVisible] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState<Visibility>('friends');
  const [saving, setSaving] = useState(false);

  // Load saved defaults
  useEffect(() => {
    AsyncStorage.multiGet(['defaultTranslation', 'defaultVisibility']).then(pairs => {
      const trans = pairs[0][1] as Translation | null;
      const vis = pairs[1][1] as Visibility | null;
      if (trans) setTranslation(trans);
      if (vis) setVisibility(vis);
    });
  }, []);

  // Load passage verses (with numbers) for selected translation
  useEffect(() => {
    if (!passage) return;
    const match = passage.reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
    if (!match) return;
    const book = match[1];
    const chapter = parseInt(match[2]);
    const verseStart = parseInt(match[3]);
    const verseEnd = match[4] ? parseInt(match[4]) : verseStart;

    supabase
      .from('bible_verses')
      .select('verse, text')
      .eq('translation', translation)
      .eq('book', book)
      .eq('chapter', chapter)
      .gte('verse', verseStart)
      .lte('verse', verseEnd)
      .order('verse')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPassageVerses(data);
        } else {
          // fallback: show NIV text as a single block with no verse numbers
          setPassageVerses([{ verse: 0, text: passage.text }]);
        }
      });
  }, [passage, translation]);

  // Recompute streak whenever today's devotion is known (covers existing devotionals on mount)
  useEffect(() => {
    if (!todaysDevotion) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) computeAndUpdateStreak(user.id);
    });
  }, [todaysDevotion?.id]);

  // Load streak for display
  useEffect(() => {
    if (!todaysDevotion) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('users').select('streak').eq('id', user.id).single().then(({ data }) => {
        if (data) setStreak(data.streak ?? 0);
      });
    });
  }, [todaysDevotion?.id]);

  async function computeAndUpdateStreak(userId: string) {
    const { data } = await supabase
      .from('devotionals')
      .select('created_at')
      .eq('user_id', userId);

    const dates = [...new Set((data ?? []).map((r: any) => {
      if (!r.created_at) return null;
      const d = new Date(r.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }).filter(Boolean))].sort().reverse();

    const todayStr = todayLocalDate();
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
    const startStr = dates.includes(todayStr) ? todayStr : yesterdayStr;

    let streak = 0;
    let expected = startStr;
    for (const date of dates) {
      if (date === expected) {
        streak++;
        const d = new Date(expected + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (date < expected) {
        break;
      }
    }

    const { data: userData } = await supabase.from('users').select('longest_streak').eq('id', userId).single();
    const longestStreak = Math.max(userData?.longest_streak ?? 0, streak);
    await supabase.from('users').update({ streak, longest_streak: longestStreak }).eq('id', userId);
  }

  async function handlePost() {
    if (!reflection.trim()) {
      Alert.alert('Empty reflection', 'Write something before posting.');
      return;
    }
    if (!passage) return;

    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPosting(false); return; }

    const { data, error } = await supabase
      .from('devotionals')
      .insert({
        user_id: user.id,
        passage_id: passage.id,
        content: reflection.trim(),
        visibility,
      })
      .select()
      .single();

    setPosting(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    haptics.success();
    setTodaysDevotion(data);
  }

  function openEdit() {
    if (!todaysDevotion) return;
    setEditContent(todaysDevotion.content);
    setEditVisibility(todaysDevotion.visibility);
    setEditVisible(true);
  }

  async function handleSaveEdit() {
    if (!editContent.trim() || !todaysDevotion) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('devotionals')
      .update({ content: editContent.trim(), visibility: editVisibility })
      .eq('id', todaysDevotion.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    haptics.success();
    setTodaysDevotion(data);
    setEditVisible(false);
  }

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center">
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  // ── No passage for today ───────────────────────────────────
  if (error || !passage) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center px-8">
        <Text style={{ color: c.textPrimary, fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
          No passage today
        </Text>
        <Text style={{ color: c.textSecondary, textAlign: 'center' }}>
          Check back soon — passages are being loaded.
        </Text>
      </View>
    );
  }

  const dateLabel = new Date(passage.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // ── AFTER posting ─────────────────────────────────────────
  if (todaysDevotion) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, paddingHorizontal: 20 }}
      >
        {/* Header */}
        <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 4 }}>
          {dateLabel.toUpperCase()}
        </Text>
        <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 2 }}>
          {passage.title}
        </Text>
        <Text style={{ color: c.accent, fontSize: 15, fontWeight: '600', marginBottom: 20 }}>
          {passage.reference}
        </Text>

        {/* Streak */}
        <View style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, marginBottom: 20 }} className="flex-row items-center gap-3">
          <StreakIcon size={28} />
          <View className="flex-1">
            <Text style={{ color: '#1A1A1A', fontSize: 18, fontWeight: '700' }}>Keep it up!</Text>
            <Text style={{ color: '#1A1A1A', fontSize: 14 }}>You posted today's devotional.</Text>
          </View>
          <View className="items-center">
            <Text style={{ color: '#1A1A1A', fontSize: 26, fontWeight: '800', lineHeight: 28 }}>{streak}</Text>
            <Text style={{ color: '#1A1A1A', fontSize: 11, fontWeight: '600', opacity: 0.7 }}>DAY STREAK</Text>
          </View>
        </View>

        {/* Posted reflection */}
        <View style={{ backgroundColor: c.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 20 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>
              YOUR REFLECTION
            </Text>
            <TouchableOpacity
              onPress={openEdit}
              style={{ backgroundColor: c.accent + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.accent + '44' }}
            >
              <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: c.textPrimary, fontSize: 16, lineHeight: 24 }}>
            {todaysDevotion.content}
          </Text>
        </View>

        {/* Edit Modal */}
        <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditVisible(false)}>
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: c.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32 }} keyboardShouldPersistTaps="handled">
              <View className="flex-row items-center justify-between mb-6">
                <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '700' }}>Edit Reflection</Text>
                <TouchableOpacity onPress={() => setEditVisible(false)}>
                  <Text style={{ color: c.textSecondary, fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {/* Passage context */}
              <Text style={{ color: c.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 2 }}>
                {passage.title}
              </Text>
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
                {passage.reference}
              </Text>
              <View style={{ backgroundColor: c.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 20 }}>
                {passageVerses.map((v, i) => (
                  v.verse === 0
                    ? <Text key={i} style={{ color: c.textPrimary, fontSize: 15, lineHeight: 24 }}>{v.text}</Text>
                    : <View key={v.verse} className="flex-row gap-2 mb-1">
                        <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700', width: 18, paddingTop: 3 }}>{v.verse}</Text>
                        <Text style={{ flex: 1, color: c.textPrimary, fontSize: 15, lineHeight: 24 }}>{v.text}</Text>
                      </View>
                ))}
              </View>

              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>YOUR REFLECTION</Text>
              <TextInput
                value={editContent}
                onChangeText={setEditContent}
                placeholder="Write your reflection..."
                placeholderTextColor={c.textSecondary}
                multiline
                style={{
                  backgroundColor: c.surface,
                  color: c.textPrimary,
                  borderColor: c.border,
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 16,
                  lineHeight: 24,
                  minHeight: 160,
                  textAlignVertical: 'top',
                  marginBottom: 16,
                }}
              />

              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>VISIBILITY</Text>
              <View className="flex-row gap-2 mb-6">
                {VISIBILITIES.map(v => (
                  <TouchableOpacity
                    key={v.value}
                    onPress={() => setEditVisibility(v.value)}
                    style={{
                      backgroundColor: editVisibility === v.value ? c.accent + '22' : c.surface,
                      borderColor: editVisibility === v.value ? c.accent : c.border,
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{
                      color: editVisibility === v.value ? c.accent : c.textSecondary,
                      fontWeight: editVisibility === v.value ? '600' : '400',
                      fontSize: 14,
                    }}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={saving || !editContent.trim()}
                style={{ backgroundColor: editContent.trim() ? c.accent : c.border, borderRadius: 14 }}
                className="py-4 items-center"
              >
                {saving
                  ? <ActivityIndicator color="#1A1A1A" />
                  : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Save Changes</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    );
  }

  // ── BEFORE posting ────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date + day */}
        <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 4 }}>
          {dateLabel.toUpperCase()}
        </Text>

        {/* Title + reference */}
        <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 2 }}>
          {passage.title}
        </Text>
        <Text style={{ color: c.accent, fontSize: 15, fontWeight: '600', marginBottom: 16 }}>
          {passage.reference}
        </Text>

        {/* Translation selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View className="flex-row gap-2">
            {TRANSLATIONS.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTranslation(t)}
                style={{
                  backgroundColor: translation === t ? c.accent : c.surface,
                  borderColor: translation === t ? c.accent : c.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{
                  color: translation === t ? '#1A1A1A' : c.textSecondary,
                  fontWeight: translation === t ? '600' : '400',
                  fontSize: 13,
                }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Passage text */}
        <View style={{ backgroundColor: c.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 16 }}>
          {passageVerses.map((v, i) => (
            v.verse === 0
              ? <Text key={i} style={{ color: c.textPrimary, fontSize: 16, lineHeight: 26 }}>{v.text}</Text>
              : <View key={v.verse} className="flex-row gap-2 mb-1">
                  <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700', width: 20, paddingTop: 3 }}>{v.verse}</Text>
                  <Text style={{ flex: 1, color: c.textPrimary, fontSize: 16, lineHeight: 26 }}>{v.text}</Text>
                </View>
          ))}
        </View>

        {/* Reflection prompt */}
        <View style={{ backgroundColor: c.accent + '22', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
            Something To Think About
          </Text>
          <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 22, fontStyle: 'italic' }}>
            "{passage.prompt}"
          </Text>
        </View>

        {/* Reflection input */}
        <TextInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="Write your reflection..."
          placeholderTextColor={c.textSecondary}
          multiline
          style={{
            backgroundColor: c.surface,
            color: c.textPrimary,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 14,
            padding: 14,
            fontSize: 16,
            lineHeight: 24,
            minHeight: 140,
            textAlignVertical: 'top',
            marginBottom: 16,
          }}
        />

        {/* Visibility selector */}
        <View className="flex-row gap-2 mb-5">
          {VISIBILITIES.map(v => (
            <TouchableOpacity
              key={v.value}
              onPress={() => { setVisibility(v.value); AsyncStorage.setItem('defaultVisibility', v.value); }}
              style={{
                backgroundColor: visibility === v.value ? c.accent + '22' : c.surface,
                borderColor: visibility === v.value ? c.accent : c.border,
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{
                color: visibility === v.value ? c.accent : c.textSecondary,
                fontWeight: visibility === v.value ? '600' : '400',
                fontSize: 14,
              }}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Post button */}
        <TouchableOpacity
          onPress={handlePost}
          disabled={posting}
          style={{ backgroundColor: c.accent, borderRadius: 14 }}
          className="py-4 items-center"
        >
          {posting
            ? <ActivityIndicator color="#1A1A1A" />
            : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>Post Devotional</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
