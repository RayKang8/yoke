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
        console.log('[useAuth] initialURL:', url ?? 'null');
        if (url?.includes('code=')) {
          // Call getSession first to ensure the Supabase client has fully
          // loaded from AsyncStorage (including the PKCE code verifier).
          await supabase.auth.getSession();
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.warn('[useAuth] cold-start exchange failed:', error.message);
          } else if (url.includes('reset-password')) {
            console.log('[useAuth] cold-start recovery detected — setting isRecovery');
            setIsRecovery(true);
          }
        }
      } catch (e) {
        console.warn('[useAuth] cold-start init error:', e);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[useAuth] session after init:', session?.user?.email ?? 'null');
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
      console.log('[useAuth] linkSub URL:', url);
      setLoading(true);
      lastEvent = null;
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) console.warn('[useAuth] linkSub exchange failed:', error.message);
      } catch (e) {
        console.warn('[useAuth] linkSub exchange threw:', e);
      }
      console.log('[useAuth] linkSub lastEvent after exchange:', lastEvent);

      // Detect recovery from the URL directly — onAuthStateChange fires async
      // so lastEvent may still be null by the time the await resolves.
      if (lastEvent === 'PASSWORD_RECOVERY' || url.includes('reset-password')) {
        console.log('[useAuth] linkSub recovery — routing effect will handle navigation');
        setLoading(false);
        return;
      }

      // Email confirmation: sign out the temporary unconfirmed session and
      // flag the routing effect to send the user to login instead of welcome.
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
