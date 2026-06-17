import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    async function init() {
      // Exchange any PKCE code from the launch URL BEFORE reading the session.
      // getInitialURL and getSession used to race — getSession would resolve first
      // with a stale/null session, drop loading to false, and fire the routing
      // effect before the code exchange completed. Now loading stays true for the
      // entire sequence, so the routing effect only ever sees the final session.
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

    // Runtime deep links: app already open (password reset, email re-confirmation).
    // Exchange the code; onAuthStateChange will update session and the routing
    // effect in _layout handles navigation.
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (!url?.includes('code=')) return;
      supabase.auth.exchangeCodeForSession(url).catch(() => {});
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
