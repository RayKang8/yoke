import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    async function init() {
      // Cold start: exchange any PKCE code before reading the session so the
      // routing effect always sees the final confirmed state.
      try {
        const url = await Linking.getInitialURL();
        if (url?.includes('code=')) {
          await supabase.auth.exchangeCodeForSession(url);
        }
      } catch {}

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    init();

    // lastEvent is set synchronously inside exchangeCodeForSession before
    // the promise resolves, so we can read it immediately after the await.
    let lastEvent: string | null = null;

    const linkSub = Linking.addEventListener('url', async ({ url }) => {
      if (!url?.includes('code=')) return;
      // Show splash while we figure out what this link is.
      setLoading(true);
      lastEvent = null;
      try {
        await supabase.auth.exchangeCodeForSession(url);
      } catch {}

      if (lastEvent === 'PASSWORD_RECOVERY') {
        // Routing effect handles this — isRecovery is now true.
        setLoading(false);
        return;
      }

      // Email confirmation: sign out the temporary unconfirmed session and
      // flag the routing effect to send the user to login instead of welcome.
      // They sign in fresh, which produces a confirmed session that the
      // routing effect uses to route them to onboarding.
      try { await supabase.auth.signOut(); } catch {}
      await AsyncStorage.setItem('post_confirm_goto_login', '1');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      lastEvent = event;
      setSession(session);
      setIsRecovery(event === 'PASSWORD_RECOVERY');
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  return { session, loading, isRecovery };
}
