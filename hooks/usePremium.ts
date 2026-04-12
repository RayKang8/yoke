import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCustomerInfo, isPremiumFromCustomerInfo } from '../lib/revenuecat';

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    check();
  }, []);

  async function check() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Check RC first (source of truth for paid subs)
    const customerInfo = await getCustomerInfo();
    const rcPremium = isPremiumFromCustomerInfo(customerInfo);

    // Check DB for trial status
    const { data: profile } = await supabase
      .from('users')
      .select('is_premium, trial_ends_at')
      .eq('id', user.id)
      .single();

    const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const trialActive = trialEnd ? trialEnd > new Date() : false;
    const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

    setIsPremium(rcPremium || profile?.is_premium || trialActive);
    setIsTrialActive(trialActive && !rcPremium && !profile?.is_premium);
    setTrialDaysLeft(daysLeft);
    setLoading(false);
  }

  return { isPremium, isTrialActive, trialDaysLeft, loading, recheck: check };
}
