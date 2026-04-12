import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Passage, Devotional, Translation } from '../types';

function todayLocalDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function usePassage() {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [todaysDevotion, setTodaysDevotion] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = todayLocalDate();

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
    if (!user) return;

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
    // Parse reference like "John 1:1-14" → book=John, chapter=1
    const match = reference.match(/^(.+?)\s+(\d+):/);
    if (!match) return null;
    const book = match[1];
    const chapter = parseInt(match[2]);

    const { data } = await supabase
      .from('bible_verses')
      .select('verse, text')
      .eq('translation', translation)
      .eq('book', book)
      .eq('chapter', chapter)
      .order('verse');

    if (!data || data.length === 0) return null;
    return data.map((v: { verse: number; text: string }) => `${v.verse} ${v.text}`).join(' ');
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
      fetchPassage();
    },
    getVerseText,
    setTodaysDevotion,
  };
}
