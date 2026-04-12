import { supabase } from './supabase';
import { Translation } from '../types';

export interface Verse {
  verse: number;
  text: string;
}

export async function getChapter(
  book: string,
  chapter: number,
  translation: Translation
): Promise<Verse[]> {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('verse, text')
    .eq('translation', translation)
    .eq('book', book)
    .eq('chapter', chapter)
    .order('verse');

  if (error || !data) return [];
  return data as Verse[];
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
