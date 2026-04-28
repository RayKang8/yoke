import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, useColorScheme, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from 'expo-router';
import { usePassage } from '../../hooks/usePassage';
import { useProfile } from '../../hooks/useProfile';
import { useGroups } from '../../hooks/useGroups';
import { usePremium } from '../../hooks/usePremium';
import { colors } from '../../constants/theme';
import { haptics } from '../../lib/haptics';
import { localDateStr } from '../../lib/utils';
import { Translation } from '../../types';
import { StreakIcon, CommentIcon, CheckIcon, LockIcon } from '../../components/icons';
import { ReactionBar } from '../../components/ReactionBar';
import { CommentThread } from '../../components/CommentThread';

const TRANSLATIONS: Translation[] = ['NIV', 'ESV', 'KJV', 'NLT', 'NKJV', 'BSB', 'ASV', 'WEB', 'YLT'];



export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const { passage, todaysDevotion, loading, error, setTodaysDevotion, refetch, refetchDevotion } = usePassage();
  const { profile, refetch: refetchProfile } = useProfile();
  const { groups } = useGroups();
  const { isPremium, loading: premiumLoading, recheck: recheckPremium } = usePremium();

  // Only refetch on focus if it's been more than 30 seconds — avoids hitting
  // the DB on every single tab switch. Always refetch if the passage date has
  // rolled past midnight.
  const lastFocusRefetch = useRef(0);
  useFocusEffect(useCallback(() => {
    const now = Date.now();
    const newDay = !!passage?.date && passage.date !== localDateStr();
    if (newDay || now - lastFocusRefetch.current > 30_000) {
      lastFocusRefetch.current = now;
      refetchProfile();
      recheckPremium();
      if (newDay) {
        setReflection('');
        refetch();
      } else {
        refetchDevotion();
      }
    }
  }, [refetchProfile, refetchDevotion, recheckPremium, refetch, passage?.date]));

  const [translation, setTranslation] = useState<Translation>('NIV');
  const [passageVerses, setPassageVerses] = useState<{ verse: number; text: string }[]>([]);
  const [reflection, setReflection] = useState('');
  // selectedAudiences: Set of 'friends' | 'public' | <groupId>
  const [selectedAudiences, setSelectedAudiences] = useState<Set<string>>(new Set(['friends']));
  const [posting, setPosting] = useState(false);

  // Reactions + comments state
  const [currentUserId, setCurrentUserId] = useState('');
  const [reactions, setReactions] = useState<{ type: string; user_id: string }[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  // Edit state
  const [editVisible, setEditVisible] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editAudiences, setEditAudiences] = useState<Set<string>>(new Set(['friends']));
  const [editCommentsDisabled, setEditCommentsDisabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-cached group shares so openEdit() needs no DB round-trip
  const cachedGroupIds = useRef<string[]>([]);
  const lastReactionRefetch = useRef(0);

  // Load current user ID once on mount so reactions/comments work immediately
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Load reactions and comment count as soon as todaysDevotion arrives
  useEffect(() => {
    if (!todaysDevotion) return;
    lastReactionRefetch.current = Date.now();
    supabase
      .from('reactions')
      .select('type, user_id')
      .eq('devotional_id', todaysDevotion.id)
      .then(({ data }) => setReactions(data ?? []));
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('devotional_id', todaysDevotion.id)
      .then(({ count }) => setCommentCount(count ?? 0));
  }, [todaysDevotion?.id]);

  // Pre-load group shares when todaysDevotion first arrives
  useEffect(() => {
    if (!todaysDevotion) { cachedGroupIds.current = []; return; }
    supabase
      .from('devotional_groups')
      .select('group_id')
      .eq('devotional_id', todaysDevotion.id)
      .then(({ data }) => {
        cachedGroupIds.current = (data ?? []).map((r: any) => r.group_id);
      });
  }, [todaysDevotion?.id]);

  // Load saved defaults — if no translation saved yet, write NIV so settings is always the source of truth
  useEffect(() => {
    AsyncStorage.multiGet(['defaultTranslation', 'postAudiences']).then(pairs => {
      const trans = pairs[0][1] as Translation | null;
      const audiences = pairs[1][1];
      if (trans) {
        setTranslation(trans);
      } else {
        AsyncStorage.setItem('defaultTranslation', 'NIV');
      }
      if (audiences) {
        try { setSelectedAudiences(new Set(JSON.parse(audiences))); } catch {}
      }
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


  // Refetch reactions and comment count whenever home tab is focused
  // (same 30s throttle as the profile/devotion refetch above)
  useFocusEffect(useCallback(() => {
    if (!todaysDevotion) return;
    const now = Date.now();
    if (now - lastReactionRefetch.current < 30_000) return;
    lastReactionRefetch.current = now;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    supabase
      .from('reactions')
      .select('type, user_id')
      .eq('devotional_id', todaysDevotion.id)
      .then(({ data }) => setReactions(data ?? []));
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('devotional_id', todaysDevotion.id)
      .then(({ count }) => setCommentCount(count ?? 0));
  }, [todaysDevotion?.id]));

  function toggleAudience(key: string) {
    setSelectedAudiences(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      AsyncStorage.setItem('postAudiences', JSON.stringify([...next]));
      return next;
    });
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

    // Derive visibility from selected audiences
    const visibility = selectedAudiences.has('public') ? 'public'
      : selectedAudiences.has('friends') ? 'friends'
      : 'private'; // allowed by devotionals_visibility_check

    const { data, error } = await supabase
      .from('devotionals')
      .insert({
        user_id: user.id,
        passage_id: passage.id,
        content: reflection.trim(),
        visibility,
        share_friends: selectedAudiences.has('friends'),
      })
      .select()
      .single();

    setPosting(false);

    if (error) {
      // Duplicate key means devotional already exists — just surface it
      if (error.code === '23505') {
        refetchDevotion();
        return;
      }
      Alert.alert('Error', error.message);
      return;
    }

    // Share to selected groups
    const groupIds = [...selectedAudiences].filter(a => a !== 'public' && a !== 'friends');
    if (groupIds.length > 0) {
      await supabase.from('devotional_groups').insert(
        groupIds.map(group_id => ({ devotional_id: data.id, group_id }))
      );
    }

    haptics.success();
    setTodaysDevotion(data);
    refetchProfile();
  }

  function openEdit() {
    if (!todaysDevotion) return;
    setEditContent(todaysDevotion.content);
    setEditCommentsDisabled(todaysDevotion.comments_disabled ?? false);

    // Build audiences from cached data — no DB round-trip
    const initial = new Set<string>();
    if (todaysDevotion.visibility === 'public') initial.add('public');
    if (todaysDevotion.share_friends) initial.add('friends');
    for (const gid of cachedGroupIds.current) initial.add(gid);
    setEditAudiences(initial);

    setEditVisible(true);
  }

  async function handleSaveEdit() {
    if (!editContent.trim() || !todaysDevotion) return;
    setSaving(true);

    try {
      const visibility = editAudiences.has('public') ? 'public'
        : editAudiences.has('friends') ? 'friends'
        : 'private';

      const groupIds = [...editAudiences].filter(a => a !== 'public' && a !== 'friends');

      const { error } = await supabase.rpc('save_devotional_edit', {
        p_devotional_id:     todaysDevotion.id,
        p_content:           editContent.trim(),
        p_visibility:        visibility,
        p_share_friends:     editAudiences.has('friends'),
        p_comments_disabled: editCommentsDisabled,
        p_group_ids:         groupIds,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      cachedGroupIds.current = groupIds;
      setTodaysDevotion({
        ...todaysDevotion,
        content: editContent.trim(),
        visibility,
        share_friends: editAudiences.has('friends'),
        comments_disabled: editCommentsDisabled,
      } as any);

      haptics.success();
      setEditVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
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
        <View style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, marginBottom: 20 }} className="flex-row items-center">
          <View className="flex-1">
            <Text style={{ color: '#1A1A1A', fontSize: 18, fontWeight: '700' }}>Keep it up!</Text>
            <Text style={{ color: '#1A1A1A', fontSize: 13, marginTop: 2, opacity: 0.65 }}>You posted today's devotional.</Text>
          </View>
          <View className="flex-row items-center gap-1">
            {!premiumLoading && (isPremium
              ? <Text style={{ color: '#1A1A1A', fontSize: 22, fontWeight: '800' }}>{profile?.streak ?? 0}</Text>
              : <LockIcon size={20} color="#1A1A1A" />
            )}
            <StreakIcon size={34} />
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

        {/* Reactions */}
        {todaysDevotion && (
          <View style={{ marginBottom: 12 }}>
            <ReactionBar
              devotionalId={todaysDevotion.id}
              reactions={reactions}
              currentUserId={currentUserId}
              isPremium={isPremium}
              onUpdate={setReactions}
            />
          </View>
        )}

        {/* Comments button */}
        {todaysDevotion && (
          <TouchableOpacity
            onPress={() => setShowComments(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}
          >
            <CommentIcon size={18} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>
              {commentCount > 0 ? `${commentCount} comment${commentCount === 1 ? '' : 's'}` : 'Add a comment'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Comment Thread */}
        {todaysDevotion && (
          <CommentThread
            devotionalId={todaysDevotion.id}
            authorId={currentUserId}
            commentsDisabled={todaysDevotion.comments_disabled ?? false}
            currentUserId={currentUserId}
            visible={showComments}
            onClose={() => setShowComments(false)}
            onCountChange={setCommentCount}
          />
        )}

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
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '600', marginBottom: 10 }}>
                {passage.reference}
              </Text>

              {/* Translation selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View className="flex-row gap-2">
                  {TRANSLATIONS.map(t => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => { setTranslation(t); AsyncStorage.setItem('defaultTranslation', t); }}
                      style={{
                        backgroundColor: translation === t ? c.accent : c.surface,
                        borderColor: translation === t ? c.accent : c.border,
                        borderWidth: 1, borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: translation === t ? '#1A1A1A' : c.textSecondary, fontWeight: translation === t ? '600' : '400', fontSize: 13 }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

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

              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>POST TO</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {(() => {
                  const onlyMe = editAudiences.size === 0;
                  return (
                    <TouchableOpacity
                      onPress={() => setEditAudiences(new Set())}
                      style={{
                        backgroundColor: onlyMe ? c.accent + '22' : c.surface,
                        borderColor: onlyMe ? c.accent : c.border,
                        borderWidth: 1, borderRadius: 20,
                        paddingHorizontal: 14, paddingVertical: 8,
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                      }}
                    >
                      {onlyMe && <CheckIcon size={13} color={c.accent} />}
                      <Text style={{ color: onlyMe ? c.accent : c.textSecondary, fontWeight: onlyMe ? '600' : '400', fontSize: 14 }}>Only Me</Text>
                    </TouchableOpacity>
                  );
                })()}
                {[{ key: 'friends', label: 'Friends' }, { key: 'public', label: 'Public' }].map(({ key, label }) => {
                  const active = editAudiences.has(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setEditAudiences(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })}
                      style={{
                        backgroundColor: active ? c.accent + '22' : c.surface,
                        borderColor: active ? c.accent : c.border,
                        borderWidth: 1, borderRadius: 20,
                        paddingHorizontal: 14, paddingVertical: 8,
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                      }}
                    >
                      {active && <CheckIcon size={13} color={c.accent} />}
                      <Text style={{ color: active ? c.accent : c.textSecondary, fontWeight: active ? '600' : '400', fontSize: 14 }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
                {groups.map(g => {
                  const active = editAudiences.has(g.id);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => setEditAudiences(prev => { const n = new Set(prev); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })}
                      style={{
                        backgroundColor: active ? c.accent + '22' : c.surface,
                        borderColor: active ? c.accent : c.border,
                        borderWidth: 1, borderRadius: 20,
                        paddingHorizontal: 14, paddingVertical: 8,
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                      }}
                    >
                      {active && <CheckIcon size={13} color={c.accent} />}
                      <Text style={{ color: active ? c.accent : c.textSecondary, fontWeight: active ? '600' : '400', fontSize: 14 }}>{g.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comments toggle */}
              <TouchableOpacity
                onPress={() => setEditCommentsDisabled(prev => !prev)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingVertical: 4 }}
              >
                <Text style={{ color: c.textPrimary, fontSize: 15 }}>Disable comments</Text>
                <View style={{
                  width: 44, height: 26, borderRadius: 13,
                  backgroundColor: editCommentsDisabled ? c.accent : c.border,
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: '#fff',
                    alignSelf: editCommentsDisabled ? 'flex-end' : 'flex-start',
                  }} />
                </View>
              </TouchableOpacity>

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
                onPress={() => { setTranslation(t); AsyncStorage.setItem('defaultTranslation', t); }}
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

        {/* Audience selector */}
        <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>POST TO</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {/* Only Me — active when nothing else is selected */}
          {(() => {
            const onlyMe = selectedAudiences.size === 0;
            return (
              <TouchableOpacity
                onPress={() => {
                  setSelectedAudiences(new Set());
                  AsyncStorage.setItem('postAudiences', JSON.stringify([]));
                }}
                style={{
                  backgroundColor: onlyMe ? c.accent + '22' : c.surface,
                  borderColor: onlyMe ? c.accent : c.border,
                  borderWidth: 1, borderRadius: 20,
                  paddingHorizontal: 14, paddingVertical: 8,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                {onlyMe && <CheckIcon size={13} color={c.accent} />}
                <Text style={{ color: onlyMe ? c.accent : c.textSecondary, fontWeight: onlyMe ? '600' : '400', fontSize: 14 }}>
                  Only Me
                </Text>
              </TouchableOpacity>
            );
          })()}
          {[{ key: 'friends', label: 'Friends' }, { key: 'public', label: 'Public' }].map(({ key, label }) => {
            const active = selectedAudiences.has(key);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => toggleAudience(key)}
                style={{
                  backgroundColor: active ? c.accent + '22' : c.surface,
                  borderColor: active ? c.accent : c.border,
                  borderWidth: 1, borderRadius: 20,
                  paddingHorizontal: 14, paddingVertical: 8,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                {active && <CheckIcon size={13} color={c.accent} />}
                <Text style={{ color: active ? c.accent : c.textSecondary, fontWeight: active ? '600' : '400', fontSize: 14 }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {groups.map(g => {
            const active = selectedAudiences.has(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                onPress={() => toggleAudience(g.id)}
                style={{
                  backgroundColor: active ? c.accent + '22' : c.surface,
                  borderColor: active ? c.accent : c.border,
                  borderWidth: 1, borderRadius: 20,
                  paddingHorizontal: 14, paddingVertical: 8,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                {active && <CheckIcon size={13} color={c.accent} />}
                <Text style={{ color: active ? c.accent : c.textSecondary, fontWeight: active ? '600' : '400', fontSize: 14 }}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            );
          })}
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
