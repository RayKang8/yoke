import { supabase } from './supabase';
import { Translation } from '../types';

export interface Verse {
  verse: number;
  text: string;
  heading?: string | null;
}

// In-memory cache keyed by "translation:book:chapter".
// Bible text is immutable so entries are valid for the lifetime of the app session.
const chapterCache = new Map<string, Verse[]>();

export async function getChapter(
  book: string,
  chapter: number,
  translation: Translation
): Promise<Verse[]> {
  const key = `${translation}:${book}:${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key)!;

  const { data, error } = await supabase
    .from('bible_verses')
    .select('verse, text, heading')
    .eq('translation', translation)
    .eq('book', book)
    .eq('chapter', chapter)
    .order('verse');

  if (error || !data) return [];
  const verses = data as Verse[];
  chapterCache.set(key, verses);
  return verses;
}

export async function searchVerses(
  query: string,
  translation: Translation,
  limit = 30
): Promise<(Verse & { book: string; chapter: number })[]> {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('book, chapter, verse, text')
    .eq('translation', translation)
    .ilike('text', `%${query}%`)
    .limit(limit);

  if (error || !data) return [];
  return data as (Verse & { book: string; chapter: number })[];
}
