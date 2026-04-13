import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, useColorScheme, Clipboard,
  Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChapter, searchVerses, Verse } from '../../lib/bible-api';
import { BIBLE_BOOKS } from '../../constants/bible-books';
import { colors } from '../../constants/theme';
import { Translation } from '../../types';

const TRANSLATIONS: Translation[] = ['NIV', 'ESV', 'KJV', 'NLT', 'NKJV', 'BSB', 'ASV', 'WEB', 'YLT'];
type View = 'book' | 'chapter' | 'reader' | 'search';

export default function BibleScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [translation, setTranslation] = useState<Translation>('NIV');
  const [view, setView] = useState<View>('book');
  const [selectedBook, setSelectedBook] = useState('John');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Verse & { book: string; chapter: number })[]>([]);
  const [searching, setSearching] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);

  const currentBook = BIBLE_BOOKS.find(b => b.name === selectedBook)!;

  const loadChapter = useCallback(async () => {
    setLoadingVerses(true);
    const data = await getChapter(selectedBook, selectedChapter, translation);
    setVerses(data);
    setLoadingVerses(false);
  }, [selectedBook, selectedChapter, translation]);

  useEffect(() => {
    if (view === 'reader') loadChapter();
  }, [view, loadChapter]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchVerses(searchQuery.trim(), translation);
    setSearchResults(results);
    setSearching(false);
  }

  function copyVerse(book: string, chapter: number, verse: number, text: string) {
    Clipboard.setString(`${book} ${chapter}:${verse} — ${text} (${translation})`);
    Alert.alert('Copied', `${book} ${chapter}:${verse} copied to clipboard.`);
  }

  // ── Book picker ──────────────────────────────────────────
  if (view === 'book') {
    const otBooks = BIBLE_BOOKS.filter(b => b.testament === 'OT');
    const ntBooks = BIBLE_BOOKS.filter(b => b.testament === 'NT');

    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: c.background }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700' }}>Bible</Text>
            <View className="flex-row gap-2 items-center">
              <TouchableOpacity onPress={() => setView('search')}
                style={{ backgroundColor: c.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: c.border }}
              >
                <Text style={{ color: c.textSecondary, fontSize: 14 }}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTranslations(true)}
                style={{ backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 }}
              >
                <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 14 }}>{translation}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {[{ label: 'Old Testament', books: otBooks }, { label: 'New Testament', books: ntBooks }].map(section => (
            <View key={section.label} className="mb-6">
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 10 }}>
                {section.label.toUpperCase()}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {section.books.map(book => (
                  <TouchableOpacity
                    key={book.name}
                    onPress={() => { setSelectedBook(book.name); setSelectedChapter(1); setView('chapter'); }}
                    style={{
                      backgroundColor: selectedBook === book.name ? c.accent : c.surface,
                      borderColor: selectedBook === book.name ? c.accent : c.border,
                      borderWidth: 1, borderRadius: 10,
                      paddingHorizontal: 12, paddingVertical: 8,
                    }}
                  >
                    <Text style={{
                      color: selectedBook === book.name ? '#1A1A1A' : c.textPrimary,
                      fontSize: 14,
                      fontWeight: selectedBook === book.name ? '600' : '400',
                    }}>
                      {book.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <TranslationModal />
      </View>
    );
  }

  // ── Chapter picker ───────────────────────────────────────
  if (view === 'chapter') {
    const chapterNums = Array.from({ length: currentBook.chapters }, (_, i) => i + 1);
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => setView('book')} className="mb-3">
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>← Books</Text>
          </TouchableOpacity>
          <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700' }}>{selectedBook}</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <View className="flex-row flex-wrap gap-3">
            {chapterNums.map(ch => (
              <TouchableOpacity
                key={ch}
                onPress={() => { setSelectedChapter(ch); setView('reader'); }}
                style={{
                  backgroundColor: selectedChapter === ch && view === 'reader' ? c.accent : c.surface,
                  borderColor: c.border, borderWidth: 1, borderRadius: 10,
                  width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: c.textPrimary, fontSize: 16, fontWeight: '500' }}>{ch}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TranslationModal />
      </View>
    );
  }

  // ── Search ───────────────────────────────────────────────
  if (view === 'search') {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => { setView('book'); setSearchResults([]); setSearchQuery(''); }} className="mb-3">
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>← Bible</Text>
          </TouchableOpacity>
          <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Search</Text>
          <View className="flex-row gap-2">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Search by keyword..."
              placeholderTextColor={c.textSecondary}
              returnKeyType="search"
              style={{
                flex: 1, backgroundColor: c.surface, color: c.textPrimary,
                borderColor: c.border, borderWidth: 1, borderRadius: 12,
                padding: 12, fontSize: 16,
              }}
            />
            <TouchableOpacity onPress={handleSearch}
              style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' }}
            >
              {searching
                ? <ActivityIndicator color="#1A1A1A" size="small" />
                : <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>Go</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={searchResults}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          ListEmptyComponent={
            !searching && searchQuery ? (
              <Text style={{ color: c.textSecondary, textAlign: 'center', marginTop: 40 }}>
                No results found.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => copyVerse(item.book, item.chapter, item.verse, item.text)}
              style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 }}
            >
              <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
                {item.book} {item.chapter}:{item.verse}
              </Text>
              <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 22 }}>{item.text}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ── Reader ───────────────────────────────────────────────
  const prevChapter = selectedChapter > 1 ? selectedChapter - 1 : null;
  const nextChapter = selectedChapter < currentBook.chapters ? selectedChapter + 1 : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => setView('chapter')}>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>← {selectedBook}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTranslations(true)}
            style={{ backgroundColor: c.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
          >
            <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 13 }}>{translation}</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: c.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 6 }}>
          {selectedBook} {selectedChapter}
        </Text>
      </View>

      {loadingVerses ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : verses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
            No verses found
          </Text>
          <Text style={{ color: c.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
            Bible data hasn't been seeded yet. Run the seed script to populate all 5 translations.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {verses.map(v => (
            <View key={v.verse}>
              {v.heading && (
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  marginTop: 20,
                  marginBottom: 6,
                }}>
                  {v.heading}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => copyVerse(selectedBook, selectedChapter, v.verse, v.text)}
                className="flex-row gap-3 mb-4"
                activeOpacity={0.6}
              >
                <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700', width: 24, paddingTop: 2 }}>
                  {v.verse}
                </Text>
                <Text style={{ flex: 1, color: c.textPrimary, fontSize: 17, lineHeight: 28 }}>
                  {v.text}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Prev / Next chapter */}
          <View className="flex-row gap-3 mt-6">
            {prevChapter && (
              <TouchableOpacity
                onPress={() => setSelectedChapter(prevChapter)}
                style={{ flex: 1, backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border }}
                className="py-3 items-center"
              >
                <Text style={{ color: c.textPrimary, fontSize: 15 }}>← Chapter {prevChapter}</Text>
              </TouchableOpacity>
            )}
            {nextChapter && (
              <TouchableOpacity
                onPress={() => setSelectedChapter(nextChapter)}
                style={{ flex: 1, backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border }}
                className="py-3 items-center"
              >
                <Text style={{ color: c.textPrimary, fontSize: 15 }}>Chapter {nextChapter} →</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      <TranslationModal />
    </View>
  );

  function TranslationModal() {
    return (
      <Modal visible={showTranslations} transparent animationType="fade" onRequestClose={() => setShowTranslations(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: '#00000066' }} onPress={() => setShowTranslations(false)} activeOpacity={1}>
          <View style={{ position: 'absolute', bottom: insets.bottom + 20, left: 20, right: 20, backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
            {TRANSLATIONS.map((t, i) => (
              <TouchableOpacity
                key={t}
                onPress={() => { setTranslation(t); setShowTranslations(false); }}
                style={{ padding: 16, borderBottomWidth: i < TRANSLATIONS.length - 1 ? 1 : 0, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Text style={{ color: c.textPrimary, fontSize: 16 }}>{t}</Text>
                {translation === t && <Text style={{ color: c.accent, fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }
}
