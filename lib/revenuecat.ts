import { Platform } from 'react-native';
import { supabase } from './supabase';

// RevenueCat is a native module — guard against Expo Go where it won't be available
let Purchases: typeof import('react-native-purchases').default | null = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // Running in Expo Go — RevenueCat not available
}

export const RC_ENTITLEMENT = 'premium';

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
  await syncPremiumStatus(customerInfo);
  return customerInfo;
}

export async function restorePurchases() {
  if (!Purchases) throw new Error('RevenueCat not available in Expo Go');
  const customerInfo = await Purchases.restorePurchases();
  await syncPremiumStatus(customerInfo);
  return customerInfo;
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

// Sync RC premium status → Supabase users table
async function syncPremiumStatus(customerInfo: import('react-native-purchases').CustomerInfo) {
  const isPremium = isPremiumFromCustomerInfo(customerInfo);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('users').update({ is_premium: isPremium }).eq('id', user.id);
}
