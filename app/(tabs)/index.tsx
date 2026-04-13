import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, useColorScheme, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { usePassage } from '../../hooks/usePassage';
import { colors } from '../../constants/theme';
import { haptics } from '../../lib/haptics';
import { Translation, Visibility } from '../../types';

const TRANSLATIONS: Translation[] = ['NIV', 'ESV', 'KJV', 'NLT', 'NKJV', 'BSB', 'ASV', 'WEB', 'YLT'];
const VISIBILITIES: { value: Visibility; label: string }[] = [
  { value: 'friends', label: 'Friends Only' },
  { value: 'public', label: 'Public' },
];

function dayOfYear(dateStr: string): number {
  const date = new Date(dateStr);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const { passage, todaysDevotion, loading, error, getVerseText, setTodaysDevotion } = usePassage();

  const [translation, setTranslation] = useState<Translation>('NIV');
  const [passageText, setPassageText] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [posting, setPosting] = useState(false);

  // Load passage text for selected translation
  useEffect(() => {
    if (!passage) return;
    if (translation === 'NIV') {
      setPassageText(passage.text);
      return;
    }
    getVerseText(passage.reference, translation).then(text => {
      setPassageText(text ?? passage.text); // fallback to NIV if not found
    });
  }, [passage, translation]);

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
  const dayNum = dayOfYear(passage.date);

  // ── AFTER posting ─────────────────────────────────────────
  if (todaysDevotion) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, paddingHorizontal: 20 }}
      >
        {/* Header */}
        <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 4 }}>
          {dateLabel.toUpperCase()} · DAY {dayNum}
        </Text>
        <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 2 }}>
          {passage.title}
        </Text>
        <Text style={{ color: c.accent, fontSize: 15, fontWeight: '600', marginBottom: 20 }}>
          {passage.reference}
        </Text>

        {/* Streak */}
        <View style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, marginBottom: 20 }} className="flex-row items-center gap-3">
          <Text style={{ fontSize: 28 }}>🔥</Text>
          <View>
            <Text style={{ color: '#1A1A1A', fontSize: 18, fontWeight: '700' }}>Keep it up!</Text>
            <Text style={{ color: '#1A1A1A', fontSize: 14 }}>You posted today's devotional.</Text>
          </View>
        </View>

        {/* Posted reflection */}
        <View style={{ backgroundColor: c.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 20 }}>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
            YOUR REFLECTION
          </Text>
          <Text style={{ color: c.textPrimary, fontSize: 16, lineHeight: 24 }}>
            {todaysDevotion.content}
          </Text>
        </View>

        {/* Passage teaser for tomorrow */}
        <View style={{ backgroundColor: c.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
            TOMORROW'S PASSAGE
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 15, fontStyle: 'italic' }}>
            Come back tomorrow to see the next passage.
          </Text>
        </View>
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
          {dateLabel.toUpperCase()} · DAY {dayNum}
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
          <Text style={{ color: c.textPrimary, fontSize: 16, lineHeight: 26 }}>
            {passageText}
          </Text>
        </View>

        {/* Reflection prompt */}
        <View style={{ backgroundColor: c.accent + '22', borderRadius: 12, padding: 14, marginBottom: 16 }}>
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
              onPress={() => setVisibility(v.value)}
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
