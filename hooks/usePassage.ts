import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Passage, Devotional, Translation } from '../types';
import { localDateStr } from '../lib/utils';

export function usePassage() {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [todaysDevotion, setTodaysDevotion] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = localDateStr();

  async function fetchPassage() {
    const { data, error } = await supabase
      .from('passages')
      .select('*')
      .eq('date', today)
      .single();

    if (error) {
      setError('No passage found for today.');
      setLoading(false);
      return;
    }
    setPassage(data);
  }

  async function fetchTodaysDevotion(passageId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('devotionals')
      .select('*')
      .eq('user_id', user.id)
      .eq('passage_id', passageId)
      .maybeSingle();

    setTodaysDevotion(data ?? null);
    setLoading(false);
  }

  async function getVerseText(reference: string, translation: Translation): Promise<string | null> {
    // Parse reference like "John 3:16-17" or "Romans 8:18-25" or "John 3:16"
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
    if (!match) return null;
    const book = match[1];
    const chapter = parseInt(match[2]);
    const verseStart = parseInt(match[3]);
    const verseEnd = match[4] ? parseInt(match[4]) : verseStart;

    const { data } = await supabase
      .from('bible_verses')
      .select('verse, text')
      .eq('translation', translation)
      .eq('book', book)
      .eq('chapter', chapter)
      .gte('verse', verseStart)
      .lte('verse', verseEnd)
      .order('verse');

    if (!data || data.length === 0) return null;
    return data.map((v: { verse: number; text: string }) => v.text).join(' ');
  }

  useEffect(() => {
    fetchPassage();
  }, [today]);

  useEffect(() => {
    if (passage) fetchTodaysDevotion(passage.id);
  }, [passage]);

  return {
    passage,
    todaysDevotion,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // If passage is already loaded for today, skip re-fetching the passage
      // and go straight to refreshing the devotion
      if (passage && passage.date === today) {
        fetchTodaysDevotion(passage.id);
      } else {
        fetchPassage();
      }
    },
    refetchDevotion: () => {
      if (passage) fetchTodaysDevotion(passage.id);
    },
    getVerseText,
    setTodaysDevotion,
  };
}
