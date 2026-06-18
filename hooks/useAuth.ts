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
      try {
        const url = await Linking.getInitialURL();
        if (url?.includes('code=')) {
          // Ensure the Supabase client has loaded from AsyncStorage
          // (including the PKCE code verifier) before attempting the exchange.
          await supabase.auth.getSession();
          // exchangeCodeForSession expects the raw auth code, not the full URL.
          const code = new URL(url).searchParams.get('code') ?? '';
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn('[useAuth] cold-start exchange failed:', error.message);
          } else if (url.includes('reset-password') && data.session) {
            setSession(data.session);
            setIsRecovery(true);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('[useAuth] cold-start init error:', e);
      }

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

    const linkSub = Linking.addEventListener('url', async ({ url }) => {
      if (!url?.includes('code=')) return;
      setLoading(true);

      // exchangeCodeForSession expects the raw auth code, not the full URL.
      const code = new URL(url).searchParams.get('code') ?? '';
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        .catch(e => ({ data: { session: null as Session | null, user: null }, error: e }));

      if (url.includes('reset-password')) {
        if (!error && data.session) {
          setSession(data.session);
          setIsRecovery(true);
        } else {
          console.warn('[useAuth] recovery exchange failed:', error?.message);
        }
        setLoading(false);
        return;
      }

      // Email confirmation: sign out and route to login
      try { await supabase.auth.signOut(); } catch {}
      await AsyncStorage.setItem('post_confirm_goto_login', '1');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // exchangeCodeForSession fires SIGNED_IN (not PASSWORD_RECOVERY) — isRecovery
      // is set directly in linkSub/init above. Only clear it on explicit sign-out.
      if (event === 'SIGNED_OUT') {
        setIsRecovery(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  return { session, loading, isRecovery };
}
