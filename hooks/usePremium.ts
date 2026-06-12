import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getCustomerInfo, isPremiumFromCustomerInfo, syncPremiumStatus } from '../lib/revenuecat';

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async function check() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user) { setLoading(false); return; }

    // Check RC first (source of truth for paid subs)
    const customerInfo = await getCustomerInfo();
    const rcPremium = isPremiumFromCustomerInfo(customerInfo);
    console.log('[usePremium] RC active entitlements:', JSON.stringify(Object.keys(customerInfo?.entitlements?.active ?? {})));
    console.log('[usePremium] rcPremium:', rcPremium);

    // Check DB
    const { data: profile } = await supabase
      .from('users')
      .select('is_premium, trial_ends_at')
      .eq('id', user.id)
      .single();
    console.log('[usePremium] DB is_premium:', profile?.is_premium);

    // RC is source of truth — heal DB in both directions
    if (rcPremium && !profile?.is_premium && customerInfo) {
      console.log('[usePremium] healing DB — RC is premium but DB is not');
      syncPremiumStatus(customerInfo).catch(e => console.warn('[usePremium] heal sync failed:', e));
    } else if (!rcPremium && profile?.is_premium && customerInfo) {
      console.log('[usePremium] healing DB — RC is not premium but DB still is (subscription lapsed)');
      syncPremiumStatus(customerInfo).catch(e => console.warn('[usePremium] heal sync failed:', e));
    }

    const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const trialActive = trialEnd ? trialEnd > new Date() : false;
    const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

    const result = rcPremium || profile?.is_premium || trialActive;
    console.log('[usePremium] final isPremium:', result);
    setIsPremium(result);
    setIsTrialActive(trialActive && !rcPremium && !profile?.is_premium);
    setTrialDaysLeft(daysLeft);
    setLoading(false);
  }, []);

  useEffect(() => { check(); }, [check]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) check();
    });
    return () => subscription.unsubscribe();
  }, [check]);

  return { isPremium, isTrialActive, trialDaysLeft, loading, recheck: check };
}
