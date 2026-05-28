import { Platform } from 'react-native';
import { supabase } from './supabase';

// RevenueCat is a native module — guard against Expo Go where it won't be available
let Purchases: typeof import('react-native-purchases').default | null = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // Running in Expo Go — RevenueCat not available
}

export const RC_ENTITLEMENT = 'Yoke Premium';

export const PRODUCT_IDS = {
  monthly: 'com.yokefaith.app.premium.monthly',
  annual:  'com.yokefaith.app.premium.annual',
} as const;

export async function initRevenueCat(userId: string) {
  if (!Purchases) return;

  const apiKey = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!;

  if (!apiKey) return;

  await Purchases.configure({ apiKey, appUserID: userId });
}

export async function getOfferings() {
  if (!Purchases) return null;
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: import('react-native-purchases').PurchasesPackage) {
  if (!Purchases) throw new Error('RevenueCat not available in Expo Go');
  const { customerInfo } = await Purchases.purchasePackage(pkg);

  console.log('[RC] purchase complete — active entitlements:', JSON.stringify(Object.keys(customerInfo.entitlements.active ?? {})));
  console.log('[RC] checking for entitlement key:', RC_ENTITLEMENT, '— found:', RC_ENTITLEMENT in (customerInfo.entitlements.active ?? {}));

  // Sync to Supabase — wrapped so a network error here never blocks the success path
  try {
    await syncPremiumStatus(customerInfo);
  } catch (e) {
    console.warn('[RC] syncPremiumStatus failed (purchase still succeeded):', e);
  }

  return customerInfo;
}

export async function restorePurchases() {
  if (!Purchases) throw new Error('RevenueCat not available in Expo Go');
  const customerInfo = await Purchases.restorePurchases();
  await syncPremiumStatus(customerInfo);
  return customerInfo;
}

export async function logOutRevenueCat() {
  if (!Purchases) return;
  try {
    await Purchases.logOut();
  } catch {
    // logOut throws if the user is already anonymous — safe to ignore
  }
}

export async function getCustomerInfo() {
  if (!Purchases) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function isPremiumFromCustomerInfo(customerInfo: import('react-native-purchases').CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  return RC_ENTITLEMENT in (customerInfo.entitlements.active ?? {});
}

// Sync RC premium status → Supabase users table via SECURITY DEFINER RPC.
// Direct UPDATE on is_premium is revoked from the authenticated role.
async function syncPremiumStatus(customerInfo: import('react-native-purchases').CustomerInfo) {
  const isPremium = isPremiumFromCustomerInfo(customerInfo);
  console.log('[RC] syncPremiumStatus — isPremium:', isPremium);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { console.warn('[RC] syncPremiumStatus — no auth user'); return; }
  const { error } = await supabase.rpc('sync_premium_status', { p_is_premium: isPremium });
  if (error) console.error('[RC] sync_premium_status RPC error:', error.message);
  else console.log('[RC] sync_premium_status RPC succeeded — is_premium set to:', isPremium);
}
